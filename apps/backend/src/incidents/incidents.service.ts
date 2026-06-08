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

type IncidentWithRelations = Awaited<
  ReturnType<IncidentsService['findIncidentById']>
>;

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const incidents = await this.prisma.incidents.findMany({
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
        discussions: {
          orderBy: { created_at: 'desc' },
        },
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
        inc_status: dto.status,
        inc_description: dto.description,
        inc_location: dto.location,
        report: dto.report,
        created_at: dto.createdAt ? new Date(dto.createdAt) : undefined,
        resolved_at:
          dto.resolvedAt === null
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
        discussions: {
          orderBy: { created_at: 'desc' },
        },
        incident_sources: {
          orderBy: { last_synced_at: 'desc' },
        },
      },
    });

    return this.toIncidentDto(incident);
  }

  async assignOrganisation(id: string, dto: AssignOrganisationDto) {
    const incident = await this.ensureIncidentExists(id);
    const organisation = await this.ensureOrganisationExists(dto.organisationId);

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
        discussions: {
          orderBy: { created_at: 'desc' },
        },
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
      report: incident.report,
      createdAt: incident.created_at,
      updatedAt: incident.updated_at,
      resolvedAt: incident.resolved_at,
      confidenceScore: incident.confidence_score,
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
      logs: incident.logs?.map((log) => ({
        id: log.id,
        content: log.content,
        createdAt: log.created_at,
      })),
      discussions: incident.discussions?.map((discussion) => ({
        id: discussion.id,
        title: discussion.title,
        createdAt: discussion.created_at,
        updatedAt: discussion.updated_at,
      })),
    };
  }

  private normaliseIncidentStatus(status: string) {
    const normalizedStatus = status.trim().toLowerCase();

    if (normalizedStatus === 'closed') {
      return 'closed';
    }

    if (normalizedStatus === 'resolved') {
      return 'resolved';
    }

    return 'active';
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

  private defaultAssignmentNotes(organisationName: string, incidentTitle: string) {
    return `${organisationName} assigned to ${incidentTitle}.`;
  }
}
