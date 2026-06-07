import { Injectable } from '@nestjs/common';
import type { Prisma, users as UserModel } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { UserWithOrganisations } from './dto/user-response.dto';

export type FindUsersFilters = {
  role?: string;
  isVerified?: boolean;
  organisationId?: string;
  search?: string;
  take?: number;
  skip?: number;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(filters: FindUsersFilters = {}): Promise<UserWithOrganisations[]> {
    return this.prisma.users.findMany({
      where: this.buildWhere(filters),
      include: {
        user_organisations: {
          include: {
            organisations: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: filters.take,
      skip: filters.skip,
    });
  }

  findById(id: string): Promise<UserWithOrganisations | null> {
    return this.prisma.users.findUnique({
      where: { id },
      include: {
        user_organisations: {
          include: {
            organisations: true,
          },
        },
      },
    });
  }

  findByEmail(email: string): Promise<UserModel | null> {
    return this.prisma.users.findUnique({
      where: { email },
    });
  }

  findByUsername(username: string): Promise<UserModel | null> {
    return this.prisma.users.findUnique({
      where: { username },
    });
  }

  update(
    id: string,
    data: Prisma.usersUpdateInput,
  ): Promise<UserWithOrganisations> {
    return this.prisma.users.update({
      where: { id },
      data,
      include: {
        user_organisations: {
          include: {
            organisations: true,
          },
        },
      },
    });
  }

  private buildWhere(filters: FindUsersFilters): Prisma.usersWhereInput {
    const where: Prisma.usersWhereInput = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isVerified !== undefined) {
      where.is_verified = filters.isVerified;
    }

    if (filters.organisationId) {
      where.user_organisations = {
        some: {
          organisation_id: filters.organisationId,
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { first_name: { contains: filters.search, mode: 'insensitive' } },
        { last_name: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
