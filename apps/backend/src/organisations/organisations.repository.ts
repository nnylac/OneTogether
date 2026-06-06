import { Injectable } from '@nestjs/common';
import type {
  organisations as OrganisationModel,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type FindOrganisationsFilters = {
  search?: string;
  take?: number;
  skip?: number;
};

@Injectable()
export class OrganisationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    filters: FindOrganisationsFilters = {},
  ): Promise<OrganisationModel[]> {
    return this.prisma.organisations.findMany({
      where: this.buildWhere(filters),
      orderBy: {
        org_name: 'asc',
      },
      take: filters.take,
      skip: filters.skip,
    });
  }

  findById(id: string): Promise<OrganisationModel | null> {
    return this.prisma.organisations.findUnique({
      where: { id },
    });
  }

  findByName(orgName: string): Promise<OrganisationModel | null> {
    return this.prisma.organisations.findUnique({
      where: { org_name: orgName },
    });
  }

  create(data: Prisma.organisationsCreateInput): Promise<OrganisationModel> {
    return this.prisma.organisations.create({ data });
  }

  update(
    id: string,
    data: Prisma.organisationsUpdateInput,
  ): Promise<OrganisationModel> {
    return this.prisma.organisations.update({
      where: { id },
      data,
    });
  }

  private buildWhere(
    filters: FindOrganisationsFilters,
  ): Prisma.organisationsWhereInput {
    const where: Prisma.organisationsWhereInput = {};

    if (filters.search) {
      where.org_name = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    return where;
  }
}
