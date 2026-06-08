import { BadRequestException, NotFoundException } from '@nestjs/common';
import type {
  broadcast_audiences as BroadcastAudienceModel,
  broadcasts as BroadcastModel,
} from '../../generated/prisma/client';
import { BroadcastsRepository } from './broadcasts.repository';
import { BroadcastsService } from './broadcasts.service';

describe('BroadcastsService', () => {
  let service: BroadcastsService;
  let repository: jest.Mocked<BroadcastsRepository>;

  const audienceModel: BroadcastAudienceModel = {
    id: '40000000-0000-0000-0000-000000000002',
    broadcast_id: '40000000-0000-0000-0000-000000000001',
    audience_type: 'role',
    audience_role: 'user',
    organisation_id: null,
    region: null,
  };

  const broadcastModel: BroadcastModel & {
    broadcast_audiences: BroadcastAudienceModel[];
  } = {
    id: '40000000-0000-0000-0000-000000000001',
    title: 'Flash flood warning',
    message: 'Avoid low-lying areas near Bishan.',
    broadcast_type: 'weather_warning',
    severity: 'warning',
    broadcast_status: 'draft',
    created_by_user_id: '50000000-0000-0000-0000-000000000001',
    published_at: null,
    archived_at: null,
    created_at: new Date('2026-06-08T10:00:00.000Z'),
    updated_at: new Date('2026-06-08T10:00:00.000Z'),
    broadcast_audiences: [audienceModel],
  };

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      replaceAudiences: jest.fn(),
    } as unknown as jest.Mocked<BroadcastsRepository>;

    service = new BroadcastsService(repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list mapped broadcasts with filters', async () => {
    repository.findMany.mockResolvedValue([broadcastModel]);

    await expect(
      service.findAll({
        status: 'draft',
        severity: 'warning',
        audienceType: 'role',
        audienceRole: 'user',
        take: '10',
        skip: '0',
      }),
    ).resolves.toMatchObject([
      {
        id: broadcastModel.id,
        title: broadcastModel.title,
        status: 'draft',
        audiences: [{ audienceType: 'role', audienceRole: 'user' }],
      },
    ]);
    expect(repository.findMany.mock.calls[0]).toEqual([
      {
        status: 'draft',
        severity: 'warning',
        broadcastType: undefined,
        audienceType: 'role',
        audienceRole: 'user',
        organisationId: undefined,
        region: undefined,
        take: 10,
        skip: 0,
      },
    ]);
  });

  it('should throw when broadcast is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(broadcastModel.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should create one draft broadcast', async () => {
    repository.create.mockResolvedValue(broadcastModel);

    await expect(
      service.create({
        title: '  Flash flood warning  ',
        message: '  Avoid low-lying areas near Bishan.  ',
        broadcastType: 'weather_warning',
        severity: 'warning',
        createdByUserId: broadcastModel.created_by_user_id!,
        audiences: [{ audienceType: 'role', audienceRole: 'user' }],
      }),
    ).resolves.toMatchObject({
      id: broadcastModel.id,
      severity: 'warning',
    });
    expect(repository.create.mock.calls[0]).toEqual([
      {
        title: 'Flash flood warning',
        message: 'Avoid low-lying areas near Bishan.',
        broadcast_type: 'weather_warning',
        severity: 'warning',
        users: {
          connect: {
            id: broadcastModel.created_by_user_id,
          },
        },
        broadcast_audiences: {
          create: [
            {
              audience_type: 'role',
              audience_role: 'user',
              organisations: undefined,
              region: undefined,
            },
          ],
        },
      },
    ]);
  });

  it('should reject invalid audience fields', async () => {
    await expect(
      service.create({
        title: 'Flash flood warning',
        message: 'Avoid low-lying areas near Bishan.',
        broadcastType: 'weather_warning',
        audiences: [
          {
            audienceType: 'role',
            audienceRole: 'user',
            organisationId: '10000000-0000-0000-0000-000000000001',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should update one draft broadcast', async () => {
    repository.findById.mockResolvedValue(broadcastModel);
    repository.update.mockResolvedValue({
      ...broadcastModel,
      title: 'Updated warning',
    });

    await expect(
      service.update(broadcastModel.id, { title: 'Updated warning' }),
    ).resolves.toMatchObject({
      title: 'Updated warning',
    });
    expect(repository.update.mock.calls[0]).toEqual([
      broadcastModel.id,
      {
        title: 'Updated warning',
        message: undefined,
        broadcast_type: undefined,
        severity: undefined,
      },
    ]);
  });

  it('should reject updates to published broadcasts', async () => {
    repository.findById.mockResolvedValue({
      ...broadcastModel,
      broadcast_status: 'published',
    });

    await expect(
      service.update(broadcastModel.id, { title: 'Updated warning' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('should publish one draft broadcast', async () => {
    repository.findById.mockResolvedValue(broadcastModel);
    repository.update.mockResolvedValue({
      ...broadcastModel,
      broadcast_status: 'published',
      published_at: new Date('2026-06-08T11:00:00.000Z'),
    });

    await expect(service.publish(broadcastModel.id)).resolves.toMatchObject({
      status: 'published',
    });
    expect(repository.update.mock.calls[0]).toEqual([
      broadcastModel.id,
      {
        broadcast_status: 'published',
        published_at: expect.any(Date) as Date,
      },
    ]);
  });

  it('should archive one published broadcast', async () => {
    repository.findById.mockResolvedValue({
      ...broadcastModel,
      broadcast_status: 'published',
    });
    repository.update.mockResolvedValue({
      ...broadcastModel,
      broadcast_status: 'archived',
      archived_at: new Date('2026-06-08T12:00:00.000Z'),
    });

    await expect(service.archive(broadcastModel.id)).resolves.toMatchObject({
      status: 'archived',
    });
  });
});
