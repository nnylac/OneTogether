import { Injectable } from '@nestjs/common';
import type { Prisma, users as UserModel } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type FindUsersFilters = {
  role?: string;
  isVerified?: boolean;
  search?: string;
  take?: number;
  skip?: number;
};

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(filters: FindUsersFilters = {}): Promise<UserModel[]> {
    return this.prisma.users.findMany({
      where: this.buildWhere(filters),
      orderBy: {
        created_at: 'desc',
      },
      take: filters.take,
      skip: filters.skip,
    });
  }

  findById(id: string): Promise<UserModel | null> {
    return this.prisma.users.findUnique({
      where: { id },
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

  update(id: string, data: Prisma.usersUpdateInput): Promise<UserModel> {
    return this.prisma.users.update({
      where: { id },
      data,
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

    if (filters.search) {
      where.OR = [
        { username: { contains: filters.search } },
        { email: { contains: filters.search } },
        { first_name: { contains: filters.search } },
        { last_name: { contains: filters.search } },
      ];
    }

    return where;
  }
}
