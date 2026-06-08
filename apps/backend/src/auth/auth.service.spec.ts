jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));

import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should require organisationIds when registering a responder account', async () => {
    await expect(
      service.createAccount({
        username: 'responder_test',
        email: 'responder@example.sg',
        password: 'password123',
        role: 'responder',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should reject empty organisationIds when registering a responder account', async () => {
    await expect(
      service.createAccount({
        username: 'responder_test',
        email: 'responder@example.sg',
        password: 'password123',
        role: 'responder',
        organisationIds: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
