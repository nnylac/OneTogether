import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { RawAgencyMessage } from './incident-middleware.types';
import {
  estimateEtaMinutes,
  resolveOriginCoordinates,
  type LatLng,
} from './station-coordinates';

type ResourceDraft = {
  unitRef: string;
  resourceKind: 'fire_engine' | 'rescue_team' | 'ambulance';
  originStation: string | null;
  etaMinutes: number | null;
  notes: string | null;
};

/**
 * Extracts the units a (SCDF) agency dispatched against an incident and persists them
 * as incident_resources rows so the Incident Room map can plot them. Each unit's origin
 * is resolved from the station reference; ETA comes from the payload or a haversine
 * fallback; status is derived from the agency ticket status. Upserts are idempotent on
 * [incident_id, unit_ref] so repeated ticket updates refresh status/ETA without
 * duplicating units.
 */
@Injectable()
export class IncidentResourceExtractorService {
  constructor(private readonly prisma: PrismaService) {}

  async extract(
    incidentId: string,
    agency: string,
    ticketStatus: string,
    destination: LatLng | null,
    message: RawAgencyMessage,
  ): Promise<void> {
    const drafts = this.readDispatchedResources(message);
    if (drafts.length === 0) {
      return;
    }

    const status = this.mapResourceStatus(ticketStatus);
    const dispatchedAt = this.dispatchedAt(message);

    for (const draft of drafts) {
      const origin = resolveOriginCoordinates(agency, draft.originStation);
      const etaMinutes =
        draft.etaMinutes ??
        (destination ? estimateEtaMinutes(origin, destination) : null);
      const etaAt =
        etaMinutes != null
          ? new Date(dispatchedAt.getTime() + etaMinutes * 60_000)
          : null;

      await this.prisma.incident_resources.upsert({
        where: {
          incident_id_unit_ref: {
            incident_id: incidentId,
            unit_ref: draft.unitRef,
          },
        },
        create: {
          incident_id: incidentId,
          unit_ref: draft.unitRef,
          agency,
          resource_kind: draft.resourceKind,
          status,
          origin_station: draft.originStation,
          origin_lat: origin.lat,
          origin_lng: origin.lng,
          eta_minutes: etaMinutes,
          eta_at: etaAt,
          dispatched_at: dispatchedAt,
          updated_at: new Date(),
          notes: draft.notes,
        },
        update: {
          status,
          eta_minutes: etaMinutes,
          eta_at: etaAt,
          updated_at: new Date(),
        },
      });
    }
  }

  private readDispatchedResources(message: RawAgencyMessage): ResourceDraft[] {
    const data = message.ticket?.data ?? {};
    const dispatched = this.asObject(data.resources_dispatched);
    if (!dispatched) {
      return [];
    }

    const drafts: ResourceDraft[] = [];

    for (const engine of this.asArray(dispatched.fire_engines)) {
      const unitRef = this.text(engine.unit_id);
      if (!unitRef) {
        continue;
      }
      drafts.push({
        unitRef,
        resourceKind: 'fire_engine',
        originStation: this.text(engine.station),
        etaMinutes:
          typeof engine.eta_minutes === 'number' ? engine.eta_minutes : null,
        notes: 'Fire appliance',
      });
    }

    for (const team of this.asArray(dispatched.rescue_teams)) {
      const unitRef = this.text(team.team_id);
      if (!unitRef) {
        continue;
      }
      const specialisation = this.text(team.specialisation);
      drafts.push({
        unitRef,
        resourceKind: 'rescue_team',
        originStation: null,
        etaMinutes: null,
        notes: specialisation ? `${specialisation} rescue team` : 'Rescue team',
      });
    }

    for (const ambulance of this.asArray(dispatched.ambulances)) {
      const unitRef = this.text(ambulance.amb_id);
      if (!unitRef) {
        continue;
      }
      const paramedics =
        typeof ambulance.paramedic_count === 'number'
          ? ambulance.paramedic_count
          : null;
      drafts.push({
        unitRef,
        resourceKind: 'ambulance',
        originStation: null,
        etaMinutes: null,
        notes: paramedics ? `${paramedics} paramedics aboard` : 'Ambulance',
      });
    }

    return drafts;
  }

  /**
   * Map an agency ticket status to a resource lifecycle status.
   * dispatched/en_route are "moving" states the map animates; on_scene/completed snap
   * to the incident.
   */
  private mapResourceStatus(ticketStatus: string): string {
    switch (ticketStatus.trim().toUpperCase()) {
      case 'IN_PROGRESS':
      case 'PENDING_INFO':
        return 'on_scene';
      case 'RESOLVED':
      case 'CLOSED':
        return 'completed';
      case 'REOPENED':
        return 'en_route';
      case 'OPEN':
      default:
        return 'dispatched';
    }
  }

  private dispatchedAt(message: RawAgencyMessage): Date {
    const triggeredAt = message.incident?.triggered_at;
    if (typeof triggeredAt === 'string') {
      const parsed = new Date(triggeredAt);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return new Date();
  }

  private asObject(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : undefined;
  }

  private asArray(value: unknown): Record<string, unknown>[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === 'object',
    );
  }

  private text(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
  }
}
