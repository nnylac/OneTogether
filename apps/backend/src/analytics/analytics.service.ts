import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AnalyticsOverviewQuery } from './analytics.controller';
import {
  deriveRegion,
  REGIONS as regions,
  type Region,
} from '../common/derive-region.util';

type AnalyticsIncident = Prisma.incidentsGetPayload<{
  include: {
    assigned_orgs: {
      include: { organisations: true };
    };
    logs: true;
  };
}>;

type ParsedFilters = {
  from: Date;
  to: Date;
  incidentType?: string;
  severity?: number;
  status?: string;
  organisationId?: string;
  region?: Region;
};

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async findOverview(query: AnalyticsOverviewQuery) {
    const filters = this.parseFilters(query);
    const incidents = await this.prisma.incidents.findMany({
      where: this.toIncidentWhere(filters),
      orderBy: { created_at: 'asc' },
      include: {
        assigned_orgs: {
          include: { organisations: true },
        },
        logs: {
          orderBy: { created_at: 'asc' },
        },
      },
    });
    const filteredIncidents = filters.region
      ? incidents.filter(
          (incident) => this.deriveRegion(incident) === filters.region,
        )
      : incidents;

    const resolutionDurations = filteredIncidents
      .map((incident) =>
        incident.resolved_at
          ? this.durationMinutes(incident.created_at, incident.resolved_at)
          : null,
      )
      .filter((duration): duration is number => duration !== null);
    const invalidDurations = resolutionDurations.filter(
      (duration) => duration < 0,
    ).length;
    const validResolutionDurations = resolutionDurations.filter(
      (duration) => duration >= 0,
    );

    return {
      filters: this.serializeFilters(filters),
      generatedAt: new Date(),
      data: {
        totals: this.getTotals(filteredIncidents, validResolutionDurations),
        incidentsByType: this.groupIncidents(
          filteredIncidents,
          (incident) => incident.incident_type,
        ),
        incidentsByRegion: regions.map((region) => ({
          region,
          count: filteredIncidents.filter(
            (incident) => this.deriveRegion(incident) === region,
          ).length,
        })),
        severityDistribution: [1, 2, 3, 4, 5].map((severity) => ({
          severity,
          count: filteredIncidents.filter(
            (incident) => incident.severity === severity,
          ).length,
        })),
        statusDistribution: this.groupIncidents(filteredIncidents, (incident) =>
          incident.inc_status.trim().toUpperCase(),
        ),
        organisations: this.getOrganisationMetrics(filteredIncidents),
      },
      dataQuality: {
        unknownRegions: filteredIncidents.filter(
          (incident) => this.deriveRegion(incident) === 'Unknown',
        ).length,
        invalidDurations,
        inferredMetrics: [
          'organisations.averageFirstUpdateMinutes',
          'organisations.averageFirstActiveResponseMinutes',
        ],
      },
    };
  }

  private getTotals(
    incidents: AnalyticsIncident[],
    resolutionDurations: number[],
  ) {
    const total = incidents.length;
    const closed = incidents.filter(
      (incident) => incident.inc_status.trim().toUpperCase() === 'CLOSED',
    ).length;
    const critical = incidents.filter(
      (incident) => incident.severity === 5,
    ).length;
    const multiAgency = incidents.filter(
      (incident) => incident.assigned_orgs.length > 1,
    ).length;

    return {
      totalIncidents: total,
      activeIncidents: total - closed,
      closedIncidents: closed,
      criticalIncidents: critical,
      criticalIncidentRate: this.rate(critical, total),
      averageSeverity:
        total === 0
          ? null
          : this.round(
              incidents.reduce((sum, incident) => sum + incident.severity, 0) /
                total,
            ),
      multiAgencyRate: this.rate(multiAgency, total),
      resolutionTimeMinutes: {
        average: this.average(resolutionDurations),
        median: this.percentile(resolutionDurations, 0.5),
        p90: this.percentile(resolutionDurations, 0.9),
        quality: 'direct',
      },
    };
  }

  private getOrganisationMetrics(incidents: AnalyticsIncident[]) {
    const metrics = new Map<
      string,
      {
        organisationId: string;
        organisationName: string;
        incidentIds: Set<string>;
        assignmentCount: number;
        activeAssignments: number;
        completedAssignments: number;
        firstUpdateMinutes: number[];
        firstActiveResponseMinutes: number[];
      }
    >();

    for (const incident of incidents) {
      for (const assignment of incident.assigned_orgs) {
        const organisation = assignment.organisations;
        const current = metrics.get(organisation.id) ?? {
          organisationId: organisation.id,
          organisationName: organisation.org_name,
          incidentIds: new Set<string>(),
          assignmentCount: 0,
          activeAssignments: 0,
          completedAssignments: 0,
          firstUpdateMinutes: [],
          firstActiveResponseMinutes: [],
        };
        current.incidentIds.add(incident.id);
        current.assignmentCount += 1;
        if (assignment.status === 'COMPLETED') {
          current.completedAssignments += 1;
        } else {
          current.activeAssignments += 1;
        }

        const agencyLogs = incident.logs.filter(
          (log) =>
            log.agency_id.trim().toUpperCase() ===
            organisation.org_name.trim().toUpperCase(),
        );
        const firstUpdate = agencyLogs[0];
        if (firstUpdate) {
          const duration = this.durationMinutes(
            incident.created_at,
            firstUpdate.created_at,
          );
          if (duration >= 0) current.firstUpdateMinutes.push(duration);
        }
        const firstActiveResponse = agencyLogs.find((log) =>
          this.isActiveResponseLog(log.content),
        );
        if (firstActiveResponse) {
          const duration = this.durationMinutes(
            incident.created_at,
            firstActiveResponse.created_at,
          );
          if (duration >= 0) {
            current.firstActiveResponseMinutes.push(duration);
          }
        }
        metrics.set(organisation.id, current);
      }
    }

    return Array.from(metrics.values())
      .map((metric) => ({
        organisationId: metric.organisationId,
        organisationName: metric.organisationName,
        incidentsHandled: metric.incidentIds.size,
        activeWorkload: metric.activeAssignments,
        completedAssignments: metric.completedAssignments,
        completionRate: this.rate(
          metric.completedAssignments,
          metric.assignmentCount,
        ),
        averageFirstUpdateMinutes: this.average(metric.firstUpdateMinutes),
        averageFirstActiveResponseMinutes: this.average(
          metric.firstActiveResponseMinutes,
        ),
        timingQuality: 'inferred',
      }))
      .sort(
        (left, right) =>
          right.incidentsHandled - left.incidentsHandled ||
          left.organisationName.localeCompare(right.organisationName),
      );
  }

  private isActiveResponseLog(content: string) {
    return (
      /\bStatus:\s*(DISPATCHED|EN_ROUTE|IN_PROGRESS|ON_SCENE|TREATING|HANDOFF|MONITORING|RESOLVED|CLOSED)\b/i.test(
        content,
      ) ||
      /\b(dispatched|deployed|en route|on scene|arrived|response underway)\b/i.test(
        content,
      )
    );
  }

  private groupIncidents(
    incidents: AnalyticsIncident[],
    keySelector: (incident: AnalyticsIncident) => string,
  ) {
    const counts = new Map<string, number>();
    for (const incident of incidents) {
      const key = keySelector(incident) || 'Unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return Array.from(counts, ([key, count]) => ({
      key,
      count,
      percentage: this.rate(count, incidents.length),
    })).sort(
      (left, right) =>
        right.count - left.count || left.key.localeCompare(right.key),
    );
  }

  private deriveRegion(incident: {
    latitude: Prisma.Decimal | null;
    longitude: Prisma.Decimal | null;
    inc_location: string | null;
  }): Region {
    return deriveRegion(incident);
  }

  private parseFilters(query: AnalyticsOverviewQuery): ParsedFilters {
    const now = new Date();
    const from = this.parseDate(
      query.from,
      new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      'from',
    );
    const to = this.parseDate(query.to, now, 'to');
    if (from >= to) {
      throw new BadRequestException('from must be earlier than to');
    }

    let severity: number | undefined;
    if (query.severity !== undefined) {
      severity = Number(query.severity);
      if (!Number.isInteger(severity) || severity < 1 || severity > 5) {
        throw new BadRequestException(
          'severity must be an integer from 1 to 5',
        );
      }
    }

    const region = query.region?.trim();
    if (region && !regions.includes(region as Region)) {
      throw new BadRequestException(
        `region must be one of: ${regions.join(', ')}`,
      );
    }

    return {
      from,
      to,
      incidentType: this.optionalString(query.incidentType),
      severity,
      status: this.optionalString(query.status)?.toUpperCase(),
      organisationId: this.optionalString(query.organisationId),
      region: region as Region | undefined,
    };
  }

  private toIncidentWhere(filters: ParsedFilters): Prisma.incidentsWhereInput {
    return {
      created_at: {
        gte: filters.from,
        lt: filters.to,
      },
      incident_type: filters.incidentType,
      severity: filters.severity,
      inc_status: filters.status,
      assigned_orgs: filters.organisationId
        ? {
            some: {
              organisation_id: filters.organisationId,
            },
          }
        : undefined,
    };
  }

  private serializeFilters(filters: ParsedFilters) {
    return {
      from: filters.from,
      to: filters.to,
      incidentType: filters.incidentType ?? null,
      severity: filters.severity ?? null,
      status: filters.status ?? null,
      organisationId: filters.organisationId ?? null,
      region: filters.region ?? null,
    };
  }

  private parseDate(value: string | undefined, fallback: Date, field: string) {
    if (!value) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid ISO timestamp`);
    }
    return parsed;
  }

  private optionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed || undefined;
  }

  private durationMinutes(start: Date, end: Date) {
    return (end.getTime() - start.getTime()) / 60_000;
  }

  private average(values: number[]) {
    if (values.length === 0) return null;
    return this.round(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    );
  }

  private percentile(values: number[], percentile: number) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((left, right) => left - right);
    const index = Math.ceil(percentile * sorted.length) - 1;
    return this.round(sorted[Math.max(0, index)]);
  }

  private rate(numerator: number, denominator: number) {
    return denominator === 0 ? 0 : this.round(numerator / denominator);
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }
}
