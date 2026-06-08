import { Injectable } from '@nestjs/common';
import type { AssignedOrganisationStatus } from '../incidents/assigned-organisation-status';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentNormalizerService } from './incident-normalizer.service';
import { IncidentResourceExtractorService } from './incident-resource-extractor.service';
import {
  NormalizedIncidentTicket,
  RawAgencyMessage,
} from './incident-middleware.types';
import { SemanticIncidentAnalyzerService } from './semantic-incident-analyzer.service';

@Injectable()
export class IncidentMiddlewareService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: IncidentNormalizerService,
    private readonly analyzer: SemanticIncidentAnalyzerService,
    private readonly resourceExtractor: IncidentResourceExtractorService,
  ) {}

  async ingest(message: RawAgencyMessage) {
    const normalized = this.normalizer.normalize(message);
    const match = await this.analyzer.findLikelyIncident(normalized);

    const incident = match
      ? await this.prisma.incidents.update({
          where: { id: match.incident.id },
          data: {
            inc_status: this.nextIncidentStatus(
              match.incident.inc_status,
              normalized.status,
            ),
            severity: Math.max(match.incident.severity, normalized.severity),
            confidence_score: Math.max(
              match.incident.confidence_score ?? 0,
              normalized.confidenceScore,
            ),
            // Backfill coordinates if an earlier report lacked them.
            lat: match.incident.lat ?? normalized.lat,
            lng: match.incident.lng ?? normalized.lng,
          },
        })
      : await this.prisma.incidents.create({
          data: {
            code: await this.nextIncidentCode(),
            title: normalized.title,
            incident_type: normalized.incidentType,
            severity: normalized.severity,
            inc_status: this.mapStatus(normalized.status),
            inc_description: normalized.description,
            inc_location: normalized.location,
            report: this.buildReport(normalized.rawMessage),
            confidence_score: normalized.confidenceScore,
            lat: normalized.lat,
            lng: normalized.lng,
          },
        });

    await this.upsertSource(incident.id, normalized.externalTicketId);
    await this.upsertSource(incident.id, normalized.externalIncidentId);
    await this.assignOrganisation(incident.id, normalized.orgId);
    await this.resourceExtractor.extract(
      incident.id,
      normalized.agencyId,
      normalized.status,
      incident.lat != null && incident.lng != null
        ? { lat: incident.lat, lng: incident.lng }
        : null,
      message,
    );
    await this.createLog(
      incident.id,
      normalized.agencyId,
      normalized.status,
      match?.reason ?? 'new_incident',
      normalized,
      normalized.rawMessage,
    );

    return {
      accepted: true,
      action: match ? 'updated_existing_incident' : 'created_incident',
      matchReason: match?.reason ?? null,
      incidentId: incident.id,
      incidentCode: incident.code,
      externalIncidentId: normalized.externalIncidentId,
      externalTicketId: normalized.externalTicketId,
    };
  }

  private async upsertSource(incidentId: string, externalTicketId: string) {
    await this.prisma.incident_sources.upsert({
      where: {
        incident_id_external_ticket_id: {
          incident_id: incidentId,
          external_ticket_id: externalTicketId,
        },
      },
      create: {
        incident_id: incidentId,
        external_ticket_id: externalTicketId,
      },
      update: {
        last_synced_at: new Date(),
      },
    });
  }

  private async assignOrganisation(
    incidentId: string,
    orgName: string,
    status: string,
    incidentTitle: string,
  ) {
    const organisation = await this.prisma.organisations.upsert({
      where: {
        org_name: orgName,
      },
      create: {
        org_name: orgName,
      },
      update: {},
    });

    await this.prisma.assigned_orgs.upsert({
      where: {
        incident_id_organisation_id: {
          incident_id: incidentId,
          organisation_id: organisation.id,
        },
      },
      create: {
        incident_id: incidentId,
        organisation_id: organisation.id,
        unit_name: `${orgName} Response Unit`,
        status: this.mapAssignmentStatus(status),
        notes: `${orgName} assigned to ${incidentTitle}.`,
      },
      update: {
        assigned_at: new Date(),
        status: this.mapAssignmentStatus(status),
      },
    });
  }

  private mapAssignmentStatus(status: string): AssignedOrganisationStatus {
    const normalizedStatus = status
      .trim()
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .toUpperCase();

    if (
      normalizedStatus.includes('CLOSED') ||
      normalizedStatus.includes('RESOLVED') ||
      normalizedStatus.includes('COMPLETED')
    ) {
      return 'COMPLETED';
    }

    if (
      normalizedStatus.includes('IN PROGRESS') ||
      normalizedStatus.includes('REOPENED') ||
      normalizedStatus.includes('ACTIVE') ||
      normalizedStatus.includes('ON SCENE')
    ) {
      return 'ON SCENE';
    }

    return 'DISPATCHED';
  }

  private async createLog(
    incidentId: string,
    agencyId: string,
    status: string,
    reason: string,
    normalized: NormalizedIncidentTicket,
    message: RawAgencyMessage,
  ) {
    await this.prisma.logs.create({
      data: {
        incident_id: incidentId,
        content: this.buildReadableLog(
          agencyId,
          status,
          reason,
          normalized,
          message,
        ),
      },
    });
  }

  private buildReadableLog(
    agencyId: string,
    status: string,
    reason: string,
    normalized: NormalizedIncidentTicket,
    message: RawAgencyMessage,
  ) {
    const ticketId = message.ticket?.ticket_id ?? normalized.externalTicketId;
    const action =
      reason === 'new_incident'
        ? 'created a new incident from'
        : 'linked an update to';
    const note = this.latestAgencyNote(message) ?? normalized.description;
    const duplicateNote = message.quality?.is_duplicate
      ? 'Possible duplicate transmission.'
      : null;
    const incompleteNote = message.quality?.is_incomplete
      ? 'Some agency fields were incomplete.'
      : null;
    const handoffNote = this.handoffNote(message);

    return [
      `${agencyId} ${action} ticket ${ticketId}.`,
      `Status: ${status}.`,
      `Priority: ${normalized.priority}.`,
      note ? `Update: ${note}.` : null,
      handoffNote,
      duplicateNote,
      incompleteNote,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private latestAgencyNote(message: RawAgencyMessage) {
    const logs = message.logs;
    if (Array.isArray(logs) && logs.length > 0) {
      const last = logs[logs.length - 1];
      if (last && typeof last === 'object') {
        const record = last as Record<string, unknown>;
        const note = record.note ?? record.entry;
        if (typeof note === 'string' && note.trim()) {
          return note.trim();
        }
      }
    }

    const ticket = message.ticket?.data ?? {};
    const candidates = [
      this.lastText(ticket.station_log, 'entry'),
      this.lastText(ticket.operations_log, 'entry'),
      this.lastText(ticket.case_notes, 'entry'),
      this.lastText(ticket.clinical_notes, 'note'),
      this.lastText(ticket.free_text_updates, 'note'),
      typeof ticket.narrative === 'string' ? ticket.narrative : undefined,
    ];

    return candidates.find((value): value is string => Boolean(value?.trim()));
  }

  private handoffNote(message: RawAgencyMessage) {
    const handoff = message.handoff;
    if (!handoff) {
      return null;
    }

    const hospital =
      typeof handoff.receiving_hospital === 'string'
        ? handoff.receiving_hospital
        : null;
    const cluster =
      typeof handoff.receiving_cluster === 'string'
        ? handoff.receiving_cluster
        : null;
    const patientCount =
      typeof handoff.patient_count === 'number' ? handoff.patient_count : null;

    return (
      [
        'Handoff recorded',
        patientCount ? `for ${patientCount} patient(s)` : null,
        hospital ? `to ${hospital}` : null,
        cluster ? `(${cluster})` : null,
      ]
        .filter(Boolean)
        .join(' ') + '.'
    );
  }

  private lastText(value: unknown, key: string) {
    if (!Array.isArray(value)) {
      return undefined;
    }
    const last = value[value.length - 1];
    if (!last || typeof last !== 'object') {
      return undefined;
    }
    const text = (last as Record<string, unknown>)[key];
    return typeof text === 'string' ? text : undefined;
  }

  private mapStatus(status: string) {
    const normalizedStatus = this.normalizedStatus(status);

    if (normalizedStatus === 'CLOSED') {
      return 'CLOSED';
    }
    if (normalizedStatus === 'RESOLVED') {
      return 'RESOLVED';
    }
    return 'ACTIVE';
  }

  private nextIncidentStatus(currentStatus: string, sourceStatus: string) {
    const normalizedSourceStatus = this.normalizedStatus(sourceStatus);
    const nextStatus = this.mapStatus(sourceStatus);

    if (normalizedSourceStatus === 'REOPENED') {
      return 'ACTIVE';
    }

    if (
      (currentStatus === 'CLOSED' || currentStatus === 'RESOLVED') &&
      nextStatus === 'ACTIVE'
    ) {
      return currentStatus;
    }

    if (currentStatus === 'CLOSED' && nextStatus === 'RESOLVED') {
      return 'CLOSED';
    }

    return nextStatus;
  }

  private normalizedStatus(status: string) {
    return status.trim().replace(/_/g, ' ').replace(/\s+/g, '_').toUpperCase();
  }

  private buildReport(message: RawAgencyMessage) {
    return JSON.stringify({
      created_by: 'incident-middleware',
      first_sender: message.sender ?? null,
      first_external_ticket_id: message.ticket?.ticket_id ?? null,
    });
  }

  private async nextIncidentCode() {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = `EXT${Date.now().toString(36).slice(-7).toUpperCase()}`;
      const existing = await this.prisma.incidents.findUnique({
        where: { code },
      });

      if (!existing) {
        return code;
      }
    }

    return `EX${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
  }
}
