import { Injectable, Logger } from '@nestjs/common';
import type { AssignedOrganisationStatus } from '../incidents/assigned-organisation-status';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentNormalizerService } from './incident-normalizer.service';
import { IncidentResourceExtractorService } from './incident-resource-extractor.service';
import {
  NormalizedIncidentTicket,
  RawAgencyMessage,
} from './incident-middleware.types';
import { SemanticIncidentAnalyzerService } from './semantic-incident-analyzer.service';
import { IncidentAnalysisService } from '../analysis/incident-analysis.service';

@Injectable()
export class IncidentMiddlewareService {
  private readonly logger = new Logger(IncidentMiddlewareService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: IncidentNormalizerService,
    private readonly analyzer: SemanticIncidentAnalyzerService,
    private readonly analysisService: IncidentAnalysisService,
    private readonly resourceExtractor: IncidentResourceExtractorService,
  ) {}

  async ingest(message: RawAgencyMessage) {
    const normalized = this.normalizer.normalize(message);
    const match = await this.analyzer.findLikelyIncident(normalized);

    const resolved = match
      ? {
          incident: await this.prisma.incidents.update({
            where: { id: match.incident.id },
            data: {
              external_incident_id:
                match.incident.external_incident_id ??
                normalized.externalIncidentId,
              inc_status: this.nextIncidentStatus(
                match.incident.inc_status,
                normalized.status,
              ),
              severity: Math.max(match.incident.severity, normalized.severity),
              confidence_score: Math.max(
                match.incident.confidence_score ?? 0,
                normalized.confidenceScore,
              ),
              latitude: normalized.latitude ?? undefined,
              longitude: normalized.longitude ?? undefined,
            },
          }),
          created: false,
        }
      : await this.createOrLoadCanonicalIncident(normalized);
    const incident = resolved.incident;

    await this.upsertSource(incident.id, normalized.externalTicketId);
    await this.upsertSource(incident.id, normalized.externalIncidentId);
    await this.assignOrganisation(
      incident.id,
      normalized.orgId,
      normalized.status,
      normalized.title,
    );
    await this.resourceExtractor.extract(
      incident.id,
      normalized.agencyId,
      normalized.status,
      incident.latitude != null && incident.longitude != null
        ? { lat: Number(incident.latitude), lng: Number(incident.longitude) }
        : null,
      message,
    );
    await this.createLog(
      incident.id,
      normalized.agencyId,
      normalized.status,
      match?.reason ??
        (resolved.created ? 'new_incident' : 'external_incident_match'),
      normalized,
      normalized.rawMessage,
    );
    const canonicalStatus = await this.reconcileCanonicalStatus(
      incident.id,
      normalized.status,
      message,
    );
    await this.applyAutomatedAnalysis(incident.id);
    if (canonicalStatus === 'CLOSED') {
      void this.analysisService
        .generateFinalAnalysis(incident.id)
        .catch((error: unknown) => {
          const message =
            error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `Final report failed for ${incident.id}: ${message}`,
          );
        });
    }

    return {
      accepted: true,
      action: resolved.created
        ? 'created_incident'
        : 'updated_existing_incident',
      matchReason:
        match?.reason ?? (resolved.created ? null : 'external_incident_match'),
      incidentId: incident.id,
      incidentCode: incident.code,
      externalIncidentId: normalized.externalIncidentId,
      externalTicketId: normalized.externalTicketId,
    };
  }

  private async reconcileCanonicalStatus(
    incidentId: string,
    sourceStatus: string,
    message?: RawAgencyMessage,
  ) {
    const [assignments, incident] = await Promise.all([
      this.prisma.assigned_orgs.findMany({
        where: { incident_id: incidentId },
        select: { status: true },
      }),
      this.prisma.incidents.findUnique({
        where: { id: incidentId },
        select: { inc_status: true },
      }),
    ]);
    const allCompleted =
      assignments.length > 0 &&
      assignments.every((assignment) => assignment.status === 'COMPLETED');
    const nextStatus = allCompleted
      ? 'CLOSED'
      : this.nextOverallStatus(
          incident?.inc_status ?? 'REPORTED',
          sourceStatus,
        );

    await this.prisma.incidents.update({
      where: { id: incidentId },
      data: {
        inc_status: nextStatus,
        resolved_at: allCompleted ? this.sourceEventTime(message ?? {}) : null,
      },
    });

    return nextStatus;
  }

  private async applyAutomatedAnalysis(incidentId: string) {
    try {
      await this.analysisService.analyzeIncidentTimeline(incidentId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Automated classification failed: ${message}`);
    }
  }

  private async createOrLoadCanonicalIncident(
    normalized: NormalizedIncidentTicket,
  ) {
    try {
      const incident = await this.prisma.incidents.create({
        data: {
          code: await this.nextIncidentCode(),
          external_incident_id: normalized.externalIncidentId,
          title: normalized.title,
          incident_type: normalized.incidentType,
          severity: normalized.severity,
          inc_status: this.mapStatus(normalized.status),
          inc_description: normalized.description,
          inc_location: normalized.location,
          latitude: normalized.latitude,
          longitude: normalized.longitude,
          report: null,
          confidence_score: normalized.confidenceScore,
        },
      });
      return { incident, created: true };
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) {
        throw error;
      }

      const incident = await this.prisma.incidents.findUnique({
        where: {
          external_incident_id: normalized.externalIncidentId,
        },
      });
      if (!incident) {
        throw error;
      }

      const updatedIncident = await this.prisma.incidents.update({
        where: { id: incident.id },
        data: {
          inc_status: this.nextIncidentStatus(
            incident.inc_status,
            normalized.status,
          ),
          severity: Math.max(incident.severity, normalized.severity),
          confidence_score: Math.max(
            incident.confidence_score ?? 0,
            normalized.confidenceScore,
          ),
          latitude: normalized.latitude ?? undefined,
          longitude: normalized.longitude ?? undefined,
        },
      });

      return { incident: updatedIncident, created: false };
    }
  }

  private isUniqueConstraintError(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }

  private async upsertSource(incidentId: string, externalTicketId: string) {
    await this.prisma.incident_sources.upsert({
      where: {
        external_ticket_id: externalTicketId,
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
      normalizedStatus.includes('ON SCENE') ||
      normalizedStatus.includes('TREATING') ||
      normalizedStatus.includes('HANDOFF') ||
      normalizedStatus.includes('MONITORING')
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
        agency_id: agencyId,
        content: this.buildReadableLog(
          agencyId,
          status,
          reason,
          normalized,
          message,
        ),
        created_at: this.sourceEventTime(message),
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
    const evidenceNote = this.evidenceNote(message);

    return [
      `${agencyId} ${action} ticket ${ticketId}.`,
      `Status: ${status}.`,
      `Priority: ${normalized.priority}.`,
      note ? `Update: ${note}.` : null,
      handoffNote,
      evidenceNote,
      duplicateNote,
      incompleteNote,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private evidenceNote(message: RawAgencyMessage) {
    const incidentLocation = message.incident?.location;
    const ticket = message.ticket?.data ?? {};
    const evidence: string[] = [];

    if (
      typeof incidentLocation?.lat === 'number' &&
      typeof incidentLocation.lng === 'number'
    ) {
      const accuracy = incidentLocation.reported_accuracy
        ? ` ${incidentLocation.reported_accuracy}`
        : '';
      evidence.push(
        `location ${incidentLocation.lat.toFixed(5)},${incidentLocation.lng.toFixed(5)}${accuracy}`,
      );
    }

    const resources = this.objectValue(ticket.resources_dispatched);
    if (resources) {
      const resourceCounts = Object.entries(resources)
        .filter(([, value]) => Array.isArray(value))
        .map(([name, value]) => `${name}=${(value as unknown[]).length}`);
      if (resourceCounts.length) {
        evidence.push(`resources ${resourceCounts.join(', ')}`);
      }
    }

    const deployment = this.objectValue(ticket.deployment);
    if (deployment) {
      const values = ['officers_deployed', 'patrol_cars']
        .filter((key) => typeof deployment[key] === 'number')
        .map((key) => `${key}=${deployment[key]}`);
      if (values.length) {
        evidence.push(`deployment ${values.join(', ')}`);
      }
    }

    const casualties = this.objectValue(ticket.casualties);
    if (casualties) {
      const values = ['injured', 'deceased', 'evacuated']
        .filter((key) => typeof casualties[key] === 'number')
        .map((key) => `${key}=${casualties[key]}`);
      if (values.length) {
        evidence.push(`casualties ${values.join(', ')}`);
      }
    }

    if (typeof ticket.scenario_phase === 'string') {
      evidence.push(`phase=${ticket.scenario_phase}`);
    }

    const statusChange = message.status_change;
    if (
      typeof statusChange?.from === 'string' &&
      typeof statusChange.to === 'string'
    ) {
      evidence.push(`transition ${statusChange.from}->${statusChange.to}`);
    }

    return evidence.length ? `Evidence: ${evidence.join('; ')}.` : null;
  }

  private objectValue(value: unknown): Record<string, unknown> | undefined {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : undefined;
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
    return this.mapOverallStatus(status);
  }

  private nextIncidentStatus(currentStatus: string, sourceStatus: string) {
    const normalizedSourceStatus = this.normalizedStatus(sourceStatus);
    const nextStatus = this.mapStatus(sourceStatus);

    if (normalizedSourceStatus === 'REOPENED') {
      return 'RESPONDING';
    }

    if (currentStatus === 'CLOSED') {
      return currentStatus;
    }

    return this.higherOverallStatus(currentStatus, nextStatus);
  }

  private nextOverallStatus(currentStatus: string, sourceStatus: string) {
    const sourceOverallStatus = this.mapOverallStatus(sourceStatus);

    if (
      sourceOverallStatus === 'RESOLVED' ||
      sourceOverallStatus === 'CLOSED'
    ) {
      return this.higherOverallStatus(currentStatus, 'MONITORING');
    }

    return this.higherOverallStatus(currentStatus, sourceOverallStatus);
  }

  private mapOverallStatus(status: string) {
    const normalizedStatus = this.normalizedStatus(status);

    if (normalizedStatus === 'CLOSED') return 'CLOSED';
    if (normalizedStatus === 'RESOLVED') return 'RESOLVED';
    if (normalizedStatus === 'MONITORING' || normalizedStatus === 'HANDOFF') {
      return 'MONITORING';
    }
    if (
      normalizedStatus === 'TREATING' ||
      normalizedStatus === 'ACTIVE_RESPONSE' ||
      normalizedStatus === 'IN_PROGRESS'
    ) {
      return 'STABILISING';
    }
    if (normalizedStatus === 'ON_SCENE') return 'ON_SCENE';
    if (
      normalizedStatus === 'DISPATCHED' ||
      normalizedStatus === 'EN_ROUTE' ||
      normalizedStatus === 'REOPENED'
    ) {
      return 'RESPONDING';
    }
    if (normalizedStatus === 'TRIAGE' || normalizedStatus === 'PENDING_INFO') {
      return 'TRIAGE';
    }
    return 'REPORTED';
  }

  private higherOverallStatus(currentStatus: string, nextStatus: string) {
    const order = [
      'REPORTED',
      'TRIAGE',
      'RESPONDING',
      'ON_SCENE',
      'STABILISING',
      'MONITORING',
      'RESOLVED',
      'CLOSED',
    ];
    const normalizedCurrent = this.normalizedStatus(currentStatus);
    const currentIndex = order.indexOf(normalizedCurrent);
    const nextIndex = order.indexOf(nextStatus);

    return nextIndex > currentIndex
      ? nextStatus
      : order[Math.max(0, currentIndex)];
  }

  private sourceEventTime(message: RawAgencyMessage) {
    const candidates = [
      message.emitted_at,
      this.latestLogTimestamp(message.logs),
    ];

    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const parsed = new Date(candidate);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }

    return new Date();
  }

  private latestLogTimestamp(logs: unknown[] | undefined) {
    if (!Array.isArray(logs) || logs.length === 0) return undefined;
    const latest = logs[logs.length - 1];
    if (!latest || typeof latest !== 'object') return undefined;
    const timestamp = (latest as Record<string, unknown>).ts;
    return typeof timestamp === 'string' ? timestamp : undefined;
  }

  private normalizedStatus(status: string) {
    return status.trim().replace(/_/g, ' ').replace(/\s+/g, '_').toUpperCase();
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
