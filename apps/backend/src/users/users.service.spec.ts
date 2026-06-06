import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { users as UserModel } from '../../generated/prisma/client';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const userModel: UserModel = {
    id: '50000000-0000-0000-0000-000000000001',
    username: 'citizen_amy',
    email: 'amy.tan@example.sg',
    first_name: 'Amy',
    last_name: 'Tan',
    phone: '+6590000001',
    is_verified: true,
    role: 'user',
    created_at: new Date('2026-06-01T00:00:00.000Z'),
    updated_at: new Date('2026-06-01T00:00:00.000Z'),
    last_login: null,
  };

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<UsersRepository>;

    service = new UsersService(repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list mapped users', async () => {
    repository.findMany.mockResolvedValue([userModel]);

    await expect(
      service.findAll({ role: 'user', isVerified: 'true' }),
    ).resolves.toEqual([
      {
        id: userModel.id,
        username: userModel.username,
        email: userModel.email,
        firstName: userModel.first_name,
        lastName: userModel.last_name,
        phone: userModel.phone,
        isVerified: userModel.is_verified,
        role: userModel.role,
        createdAt: userModel.created_at,
        updatedAt: userModel.updated_at,
        lastLogin: userModel.last_login,
      },
    ]);
    expect(repository.findMany.mock.calls[0]).toEqual([
      {
        role: 'user',
        isVerified: true,
        search: undefined,
        take: undefined,
        skip: undefined,
      },
    ]);
  });

  it('should throw when filtering by invalid role', async () => {
    await expect(service.findAll({ role: 'responder' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should get one mapped user', async () => {
    repository.findById.mockResolvedValue(userModel);

    await expect(service.findOne(userModel.id)).resolves.toMatchObject({
      id: userModel.id,
      firstName: userModel.first_name,
    });
  });

  it('should throw when user is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(userModel.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update one user', async () => {
    repository.findById.mockResolvedValue(userModel);
    repository.update.mockResolvedValue({ ...userModel, first_name: 'Amelia' });

    await expect(
      service.update(userModel.id, { firstName: 'Amelia' }),
    ).resolves.toMatchObject({
      firstName: 'Amelia',
    });
    expect(repository.update.mock.calls[0]).toEqual([
      userModel.id,
      {
        first_name: 'Amelia',
        last_name: undefined,
        phone: undefined,
        is_verified: undefined,
        role: undefined,
      },
    ]);
  });
});
