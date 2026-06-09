import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type {
  IncidentMapDto,
  IncidentMapResourceDto,
  IncidentMapSummaryDto,
} from './dto/incident-map.dto';

type IncidentResourceRow = {
  id: string;
  unit_ref: string;
  agency: string;
  resource_kind: string;
  status: string;
  origin_station: string | null;
  origin_lat: number | null;
  origin_lng: number | null;
  eta_minutes: number | null;
  eta_at: Date | null;
  dispatched_at: Date;
  updated_at: Date;
  notes: string | null;
};

@Injectable()
export class MapsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Operational map snapshot for a single incident room: the incident's own location
   * plus every resource dispatched to it, with the counts the summary bar needs.
   */
  async getIncidentMap(incidentId: string): Promise<IncidentMapDto> {
    const incident = await this.prisma.incidents.findUnique({
      where: { id: incidentId },
      include: {
        resources: {
          orderBy: { dispatched_at: 'asc' },
        },
      },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    const lat = incident.latitude ? Number(incident.latitude) : null;
    const lng = incident.longitude ? Number(incident.longitude) : null;

    const resources = incident.resources.map((resource) =>
      this.toResourceDto(resource, lat, lng),
    );

    return {
      incident: {
        id: incident.id,
        code: incident.code,
        title: incident.title,
        incidentType: incident.incident_type,
        severity: incident.severity,
        status: this.normaliseStatus(incident.inc_status),
        location: incident.inc_location,
        lat,
        lng,
      },
      resources,
      summary: this.summarise(resources),
    };
  }

  private toResourceDto(
    resource: IncidentResourceRow,
    destLat: number | null,
    destLng: number | null,
  ): IncidentMapResourceDto {
    return {
      id: resource.id,
      unitRef: resource.unit_ref,
      agency: resource.agency,
      resourceKind: resource.resource_kind,
      status: resource.status,
      originStation: resource.origin_station,
      originLat: resource.origin_lat,
      originLng: resource.origin_lng,
      destLat,
      destLng,
      etaMinutes: resource.eta_minutes,
      etaAt: resource.eta_at ? resource.eta_at.toISOString() : null,
      dispatchedAt: resource.dispatched_at.toISOString(),
      updatedAt: resource.updated_at.toISOString(),
      notes: resource.notes,
    };
  }

  private summarise(
    resources: IncidentMapResourceDto[],
  ): IncidentMapSummaryDto {
    const summary: IncidentMapSummaryDto = {
      total: resources.length,
      dispatched: 0,
      enRoute: 0,
      onScene: 0,
      returning: 0,
      unavailable: 0,
      completed: 0,
    };

    for (const resource of resources) {
      switch (resource.status) {
        case 'dispatched':
          summary.dispatched += 1;
          break;
        case 'en_route':
          summary.enRoute += 1;
          break;
        case 'on_scene':
          summary.onScene += 1;
          break;
        case 'returning':
          summary.returning += 1;
          break;
        case 'unavailable':
          summary.unavailable += 1;
          break;
        case 'completed':
          summary.completed += 1;
          break;
      }
    }

    return summary;
  }

  private normaliseStatus(status: string): string {
    const value = status.trim().toLowerCase();
    if (value === 'closed') {
      return 'closed';
    }
    if (value === 'resolved') {
      return 'resolved';
    }
    return 'active';
  }
}
