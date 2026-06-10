import { Injectable } from '@nestjs/common';
import type {
  Prisma,
  volunteer_sources as VolunteerSourceModel,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { VolunteerOpportunityWithSource } from './dto/volunteer-opportunity-response.dto';

export type FindVolunteerOpportunitiesFilters = {
  sourceId?: string;
  region?: string;
  opportunityType?: string;
  urgency?: string;
  status?: string;
  search?: string;
  take?: number;
  skip?: number;
};

@Injectable()
export class VolunteerRepository {
  constructor(private readonly prisma: PrismaService) {}

  findSources(): Promise<VolunteerSourceModel[]> {
    return this.prisma.volunteer_sources.findMany({
      orderBy: { source_name: 'asc' },
    });
  }

  findSourceById(id: string): Promise<VolunteerSourceModel | null> {
    return this.prisma.volunteer_sources.findUnique({ where: { id } });
  }

  findSourceByUrl(sourceUrl: string): Promise<VolunteerSourceModel | null> {
    return this.prisma.volunteer_sources.findUnique({
      where: { source_url: sourceUrl },
    });
  }

  createSource(
    data: Prisma.volunteer_sourcesCreateInput,
  ): Promise<VolunteerSourceModel> {
    return this.prisma.volunteer_sources.create({ data });
  }

  updateSource(
    id: string,
    data: Prisma.volunteer_sourcesUpdateInput,
  ): Promise<VolunteerSourceModel> {
    return this.prisma.volunteer_sources.update({
      where: { id },
      data,
    });
  }

  findOpportunities(
    filters: FindVolunteerOpportunitiesFilters = {},
  ): Promise<VolunteerOpportunityWithSource[]> {
    return this.prisma.volunteer_opportunities.findMany({
      where: this.buildOpportunityWhere(filters),
      include: { volunteer_sources: true },
      orderBy: [{ start_at: 'asc' }, { created_at: 'desc' }],
      take: filters.take,
      skip: filters.skip,
    });
  }

  findOpportunityById(
    id: string,
  ): Promise<VolunteerOpportunityWithSource | null> {
    return this.prisma.volunteer_opportunities.findUnique({
      where: { id },
      include: { volunteer_sources: true },
    });
  }

  upsertOpportunity(
    sourceId: string,
    externalId: string,
    data: Omit<Prisma.volunteer_opportunitiesUncheckedCreateInput, 'id'>,
  ): Promise<VolunteerOpportunityWithSource> {
    return this.prisma.volunteer_opportunities.upsert({
      where: {
        source_id_external_id: {
          source_id: sourceId,
          external_id: externalId,
        },
      },
      create: data,
      update: {
        title: data.title,
        description: data.description,
        opportunity_type: data.opportunity_type,
        urgency: data.urgency,
        location: data.location,
        region: data.region,
        start_at: data.start_at,
        end_at: data.end_at,
        slots_total: data.slots_total,
        slots_filled: data.slots_filled,
        requires_training: data.requires_training,
        signup_url: data.signup_url,
        source_url: data.source_url,
        external_updated_at: data.external_updated_at,
        opportunity_status: data.opportunity_status,
      },
      include: { volunteer_sources: true },
    });
  }

  private buildOpportunityWhere(
    filters: FindVolunteerOpportunitiesFilters,
  ): Prisma.volunteer_opportunitiesWhereInput {
    const where: Prisma.volunteer_opportunitiesWhereInput = {};

    if (filters.sourceId) {
      where.source_id = filters.sourceId;
    }

    if (filters.region) {
      where.region = { contains: filters.region, mode: 'insensitive' };
    }

    if (filters.opportunityType) {
      where.opportunity_type = filters.opportunityType;
    }

    if (filters.urgency) {
      where.urgency = filters.urgency;
    }

    if (filters.status) {
      where.opportunity_status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { location: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
