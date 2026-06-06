import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { FindUsersFilters, UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  private readonly allowedRoles = new Set(['user', 'moderator', 'admin']);

  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(query: UserQueryDto = {}): Promise<UserResponseDto[]> {
    const users = await this.usersRepository.findMany(this.toFilters(query));
    return users.map((user) => UserResponseDto.fromModel(user));
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return UserResponseDto.fromModel(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.ensureExists(id);

    if (dto.role !== undefined) {
      this.validateRole(dto.role);
    }

    const updatedUser = await this.usersRepository.update(
      id,
      this.toUpdateInput(dto),
    );
    return UserResponseDto.fromModel(updatedUser);
  }

  private async ensureExists(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private toFilters(query: UserQueryDto): FindUsersFilters {
    if (query.role !== undefined) {
      this.validateRole(query.role);
    }

    return {
      role: query.role,
      isVerified: this.parseBoolean(query.isVerified, 'isVerified'),
      search: query.search,
      take: this.parseNumber(query.take, 'take'),
      skip: this.parseNumber(query.skip, 'skip'),
    };
  }

  private toUpdateInput(dto: UpdateUserDto): Prisma.usersUpdateInput {
    return {
      first_name: dto.firstName,
      last_name: dto.lastName,
      phone: dto.phone,
      is_verified: dto.isVerified,
      role: dto.role,
    };
  }

  private validateRole(role: string): void {
    if (!this.allowedRoles.has(role)) {
      throw new BadRequestException('Invalid user role');
    }
  }

  private parseBoolean(
    value: boolean | string | undefined,
    field: string,
  ): boolean | undefined {
    if (value === undefined || typeof value === 'boolean') {
      return value;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    throw new BadRequestException(`${field} must be true or false`);
  }

  private parseNumber(
    value: number | string | undefined,
    field: string,
  ): number | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }

    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new BadRequestException(`${field} must be a non-negative integer`);
    }

    return parsed;
  }
}
