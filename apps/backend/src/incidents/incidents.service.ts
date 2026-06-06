import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
      },
    });
  }

  private toIncidentDto(incident: NonNullable<IncidentWithRelations>) {
    return {
      id: incident.id,
      incidentCode: incident.code,
      title: incident.title,
      incidentType: incident.incident_type,
      severity: incident.severity,
      status: incident.inc_status,
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
}
