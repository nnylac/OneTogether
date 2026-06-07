import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssignOrganisationDto } from './assign-organisation.dto';
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
    await this.ensureIncidentExists(id);
    await this.ensureOrganisationExists(dto.organisationId);

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
      },
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
      select: { id: true },
    });

    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
  }

  private async ensureOrganisationExists(id: string) {
    if (!id?.trim()) {
      throw new BadRequestException('organisationId is required');
    }

    const organisation = await this.prisma.organisations.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }
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
        unit: `${assignedOrg.organisations.org_name} Response Unit`,
        agency: assignedOrg.organisations.org_name,
        type: this.getResourceType(
          assignedOrg.organisations.org_name,
          incident.incident_type,
        ),
        assignedAt: assignedOrg.assigned_at,
        status: this.getResourceStatus(incident.inc_status),
        notes: `${assignedOrg.organisations.org_name} assigned to ${incident.title}.`,
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

  private getResourceStatus(status: string) {
    const incidentStatus = this.normaliseIncidentStatus(status);

    if (incidentStatus === 'active') {
      return 'on scene';
    }

    return 'engaged';
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
}
