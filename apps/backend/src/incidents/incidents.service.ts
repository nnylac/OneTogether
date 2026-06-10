import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AssignedOrganisationStatus,
  toAssignedOrganisationStatus,
} from './assigned-organisation-status';
import { AssignOrganisationDto } from './assign-organisation.dto';
import { UpdateAssignedOrganisationDto } from './update-assigned-organisation.dto';
import { UpdateIncidentDto } from './update-incident.dto';
import type { Prisma } from '../../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

type IncidentWithRelations = Awaited<
  ReturnType<IncidentsService['findIncidentById']>
>;

@Injectable()
export class IncidentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(filters: { organisationId?: string } = {}) {
    const where: Prisma.incidentsWhereInput = {};
    const organisationId = filters.organisationId?.trim();

    if (organisationId) {
      where.assigned_orgs = {
        some: {
          organisation_id: organisationId,
        },
      };
    }

    const incidents = await this.prisma.incidents.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        assigned_orgs: {
          include: {
            organisations: true,
          },
        },
        logs: {
          orderBy: { created_at: 'desc' },
        },
        discussions: true,
        incident_sources: {
          orderBy: { last_synced_at: 'desc' },
        },
      },
    });

    return incidents.map((incident) => this.toIncidentDto(incident));
  }

  async findOne(id: string) {
    const incident = await this.findIncidentById(id);

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return this.toIncidentDto(incident);
  }

  async update(id: string, dto: UpdateIncidentDto) {
    await this.ensureIncidentExists(id);

    const incident = await this.prisma.incidents.update({
      where: { id },
      data: {
        title: dto.title,
        incident_type: dto.incidentType,
        severity: dto.severity,
        inc_status:
          dto.status === undefined ? undefined : dto.status.toUpperCase(),
        inc_description: dto.description,
        inc_location: dto.location,
        report: dto.report,
        executive_summary: dto.executiveSummary,
        response_plan: dto.responsePlan,
        entities: dto.entities,
        created_at: dto.createdAt ? new Date(dto.createdAt) : undefined,
        resolved_at:
          dto.status === 'closed'
            ? new Date()
            : dto.status !== undefined && dto.status !== 'resolved'
              ? null
              : dto.resolvedAt === null
                ? null
                : dto.resolvedAt
                  ? new Date(dto.resolvedAt)
                  : undefined,
        confidence_score: dto.confidenceScore,
        updated_at: new Date(),
      },
      include: {
        assigned_orgs: {
          include: {
            organisations: true,
          },
        },
        logs: {
          orderBy: { created_at: 'desc' },
        },
        discussions: true,
        incident_sources: {
          orderBy: { last_synced_at: 'desc' },
        },
      },
    });

    return this.toIncidentDto(incident);
  }

  async assignOrganisation(id: string, dto: AssignOrganisationDto) {
    const incident = await this.ensureIncidentExists(id);
    const organisation = await this.ensureOrganisationExists(
      dto.organisationId,
    );

    const existingAssignment = await this.prisma.assigned_orgs.findUnique({
      where: {
        incident_id_organisation_id: {
          incident_id: id,
          organisation_id: dto.organisationId,
        },
      },
    });

    if (existingAssignment) {
      throw new ConflictException('Organisation already assigned to incident');
    }

    await this.prisma.assigned_orgs.create({
      data: {
        incident_id: id,
        organisation_id: dto.organisationId,
        unit_name: this.resolveUnitName(dto.unitName, organisation.org_name),
        status: this.resolveAssignmentStatus(dto.status) ?? 'DISPATCHED',
        notes:
          dto.notes ??
          this.defaultAssignmentNotes(organisation.org_name, incident.title),
      },
    });

    await this.createIncidentAssignedNotification({
      incidentId: id,
      incidentTitle: incident.title,
      organisationId: dto.organisationId,
      organisationName: organisation.org_name,
    });

    const updatedIncident = await this.findIncidentById(id);

    if (!updatedIncident) {
      throw new NotFoundException('Incident not found');
    }

    return this.toIncidentDto(updatedIncident);
  }

  async updateAssignedOrganisation(
    id: string,
    organisationId: string,
    dto: UpdateAssignedOrganisationDto,
  ) {
    await this.ensureIncidentExists(id);

    const existingAssignment = await this.prisma.assigned_orgs.findUnique({
      where: {
        incident_id_organisation_id: {
          incident_id: id,
          organisation_id: organisationId,
        },
      },
    });

    if (!existingAssignment) {
      throw new NotFoundException('Assigned organisation not found');
    }

    const data = {
      unit_name:
        dto.unitName === undefined
          ? undefined
          : this.resolveUnitName(dto.unitName),
      status: this.resolveAssignmentStatus(dto.status),
      notes: dto.notes,
    };

    await this.prisma.assigned_orgs.update({
      where: {
        incident_id_organisation_id: {
          incident_id: id,
          organisation_id: organisationId,
        },
      },
      data,
    });

    const incident = await this.findIncidentById(id);

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return this.toIncidentDto(incident);
  }

  private findIncidentById(id: string) {
    return this.prisma.incidents.findUnique({
      where: { id },
      include: {
        assigned_orgs: {
          include: {
            organisations: true,
          },
        },
        logs: {
          orderBy: { created_at: 'desc' },
        },
        discussions: true,
        incident_sources: {
          orderBy: { last_synced_at: 'desc' },
        },
      },
    });
  }

  async findLogs(id: string) {
    const incident = await this.prisma.incidents.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    const logs = await this.prisma.logs.findMany({
      where: { incident_id: id },
      orderBy: { created_at: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      agencyId: log.agency_id,
      content: log.content,
      createdAt: log.created_at,
    }));
  }

  private async ensureIncidentExists(id: string) {
    const incident = await this.prisma.incidents.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return incident;
  }

  private async ensureOrganisationExists(id: string) {
    if (!id?.trim()) {
      throw new BadRequestException('organisationId is required');
    }

    const organisation = await this.prisma.organisations.findUnique({
      where: { id },
      select: { id: true, org_name: true },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  private toIncidentDto(incident: NonNullable<IncidentWithRelations>) {
    return {
      id: incident.id,
      incidentCode: incident.code,
      title: incident.title,
      incidentType: incident.incident_type,
      severity: incident.severity,
      status: this.normaliseIncidentStatus(incident.inc_status),
      description: incident.inc_description,
      location: incident.inc_location,
      lat: incident.latitude == null ? null : Number(incident.latitude),
      lng: incident.longitude == null ? null : Number(incident.longitude),
      report: incident.report,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at,
      resolvedAt: incident.resolved_at,
      confidenceScore: incident.confidence_score,
      aiAnalysis: {
        category: incident.category,
        urgency: incident.urgency,
        severityEstimate: incident.severity_estimate,
        confidence:
          incident.confidence === null ? null : Number(incident.confidence),
        finalAnalysis: {
          status: incident.analysis_status,
          executiveSummary: incident.executive_summary,
          responsePlan: incident.response_plan,
          entities: incident.entities,
          finalizedAt: incident.analysis_finalized_at,
        },
      },
      assignedOrgs: incident.assigned_orgs.map(
        (assignedOrg) => assignedOrg.organisations.org_name,
      ),
      sourceLinks: incident.incident_sources?.map((source) => ({
        externalTicketId: source.external_ticket_id,
        lastSyncedAt: source.last_synced_at,
      })),
      assignedResources: incident.assigned_orgs.map((assignedOrg) => ({
        id: `${incident.id}:${assignedOrg.organisation_id}`,
        organisationId: assignedOrg.organisation_id,
        unit: assignedOrg.unit_name,
        agency: assignedOrg.organisations.org_name,
        type: this.getResourceType(
          assignedOrg.organisations.org_name,
          incident.incident_type,
        ),
        assignedAt: assignedOrg.assigned_at,
        status: assignedOrg.status,
        notes: assignedOrg.notes,
      })),
      agencyProgress: this.getAgencyProgress(incident.logs ?? []),
      logs: incident.logs?.map((log) => ({
        id: log.id,
        agencyId: log.agency_id,
        content: log.content,
        createdAt: log.created_at,
      })),
      discussions: incident.discussions
        ? [
            {
              id: incident.discussions.id,
              title: incident.discussions.title,
              createdAt: incident.discussions.created_at,
              updatedAt: incident.discussions.updated_at,
            },
          ]
        : [],
    };
  }

  private normaliseIncidentStatus(status: string) {
    const normalizedStatus = status.trim().toLowerCase();
    const knownStatuses = new Set([
      'reported',
      'triage',
      'responding',
      'on_scene',
      'stabilising',
      'monitoring',
      'resolved',
      'closed',
    ]);

    return knownStatuses.has(normalizedStatus) ? normalizedStatus : 'reported';
  }

  private getAgencyProgress(
    logs: Array<{
      agency_id: string;
      content: string;
      created_at: Date;
    }>,
  ) {
    const progress = new Map<
      string,
      { agency: string; stage: string; updatedAt: Date }
    >();

    for (const log of logs) {
      if (progress.has(log.agency_id)) continue;
      const match = log.content.match(/\bStatus:\s*([A-Z][A-Z_ ]*)\./i);
      if (!match) continue;
      progress.set(log.agency_id, {
        agency: log.agency_id,
        stage: match[1].trim().replace(/\s+/g, '_').toUpperCase(),
        updatedAt: log.created_at,
      });
    }

    return Array.from(progress.values());
  }

  private getResourceType(organisationName: string, incidentType: string) {
    const resourceTypes: Record<string, string> = {
      EMA: 'Power Restoration Crew',
      HDB: 'Estate Response Team',
      LTA: 'Traffic Support',
      MOH: 'Medical Support',
      NEA: 'Environmental Assessment',
      PUB: 'Flood Response',
      SCDF: incidentType === 'Fire' ? 'Fire Appliance' : 'Emergency Response',
      SGH: 'Medical Team',
      SPF: 'Police Response',
    };

    return resourceTypes[organisationName] ?? 'Response Unit';
  }

  private resolveUnitName(unitName?: string, organisationName?: string) {
    const resolvedUnitName =
      unitName?.trim() ??
      (organisationName ? `${organisationName} Response Unit` : '');

    if (!resolvedUnitName) {
      throw new BadRequestException('unitName cannot be empty');
    }

    if (resolvedUnitName.length > 120) {
      throw new BadRequestException('unitName cannot exceed 120 characters');
    }

    return resolvedUnitName;
  }

  private resolveAssignmentStatus(
    status?: string,
  ): AssignedOrganisationStatus | undefined {
    if (status === undefined) {
      return undefined;
    }

    const resolvedStatus = toAssignedOrganisationStatus(status);

    if (!resolvedStatus) {
      throw new BadRequestException(
        'status must be one of: DISPATCHED, ON SCENE, COMPLETED',
      );
    }

    return resolvedStatus;
  }

  private defaultAssignmentNotes(
    organisationName: string,
    incidentTitle: string,
  ) {
    return `${organisationName} assigned to ${incidentTitle}.`;
  }

  private async createIncidentAssignedNotification({
    incidentId,
    incidentTitle,
    organisationId,
    organisationName,
  }: {
    incidentId: string;
    incidentTitle: string;
    organisationId: string;
    organisationName: string;
  }) {
    await this.notificationsService.create({
      title: `${incidentTitle} assigned to your organisation`,
      message: `${organisationName} has been assigned to ${incidentTitle}.`,
      notificationType: 'incident_assigned',
      referenceType: 'incident',
      referenceId: incidentId,
      metadata: {
        assignedAt: new Date().toISOString(),
        organisationId,
        organisationName,
      },
      recipients: [
        {
          recipientType: 'organisation',
          recipientId: organisationId,
        },
      ],
    });
  }
}
