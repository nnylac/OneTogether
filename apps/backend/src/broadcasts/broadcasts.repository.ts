import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { BroadcastWithAudiences } from './dto/broadcast-response.dto';

export type FindBroadcastsFilters = {
  status?: string;
  severity?: string;
  broadcastType?: string;
  audienceType?: string;
  audienceRole?: string;
  organisationId?: string;
  region?: string;
  take?: number;
  skip?: number;
};

@Injectable()
export class BroadcastsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    filters: FindBroadcastsFilters = {},
  ): Promise<BroadcastWithAudiences[]> {
    return this.prisma.broadcasts.findMany({
      where: this.buildWhere(filters),
      include: {
        broadcast_audiences: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: filters.take,
      skip: filters.skip,
    });
  }

  findById(id: string): Promise<BroadcastWithAudiences | null> {
    return this.prisma.broadcasts.findUnique({
      where: { id },
      include: {
        broadcast_audiences: true,
      },
    });
  }

  create(data: Prisma.broadcastsCreateInput): Promise<BroadcastWithAudiences> {
    return this.prisma.broadcasts.create({
      data,
      include: {
        broadcast_audiences: true,
      },
    });
  }

  update(
    id: string,
    data: Prisma.broadcastsUpdateInput,
  ): Promise<BroadcastWithAudiences> {
    return this.prisma.broadcasts.update({
      where: { id },
      data,
      include: {
        broadcast_audiences: true,
      },
    });
  }

  replaceAudiences(
    broadcastId: string,
    audiences: Prisma.broadcast_audiencesCreateManyInput[],
  ): Promise<BroadcastWithAudiences> {
    return this.prisma.$transaction(async (tx) => {
      await tx.broadcast_audiences.deleteMany({
        where: { broadcast_id: broadcastId },
      });

      if (audiences.length > 0) {
        await tx.broadcast_audiences.createMany({ data: audiences });
      }

      return tx.broadcasts.findUniqueOrThrow({
        where: { id: broadcastId },
        include: {
          broadcast_audiences: true,
        },
      });
    });
  }

  private buildWhere(
    filters: FindBroadcastsFilters,
  ): Prisma.broadcastsWhereInput {
    const where: Prisma.broadcastsWhereInput = {};

    if (filters.status) {
      where.broadcast_status = filters.status;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.broadcastType) {
      where.broadcast_type = filters.broadcastType;
    }

    const audienceWhere = this.buildAudienceWhere(filters);

    if (Object.keys(audienceWhere).length > 0) {
      where.broadcast_audiences = {
        some: audienceWhere,
      };
    }

    return where;
  }

  private buildAudienceWhere(
    filters: FindBroadcastsFilters,
  ): Prisma.broadcast_audiencesWhereInput {
    const where: Prisma.broadcast_audiencesWhereInput = {};

    if (filters.audienceType) {
      where.audience_type = filters.audienceType;
    }

    if (filters.audienceRole) {
      where.audience_role = filters.audienceRole;
    }

    if (filters.organisationId) {
      where.organisation_id = filters.organisationId;
    }

    if (filters.region) {
      where.region = filters.region;
    }

    return where;
  }
}
