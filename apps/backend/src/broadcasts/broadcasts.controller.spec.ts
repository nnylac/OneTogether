import { Test, TestingModule } from '@nestjs/testing';
import { BroadcastQueryDto } from './dto/broadcast-query.dto';
import { BroadcastResponseDto } from './dto/broadcast-response.dto';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsService } from './broadcasts.service';

describe('BroadcastsController', () => {
  let controller: BroadcastsController;
  let service: jest.Mocked<BroadcastsService>;

  const broadcast: BroadcastResponseDto = {
    id: '40000000-0000-0000-0000-000000000001',
    title: 'Flash flood warning',
    message: 'Avoid low-lying areas near Bishan.',
    broadcastType: 'weather_warning',
    severity: 'warning',
    status: 'draft',
    createdByUserId: '50000000-0000-0000-0000-000000000001',
    publishedAt: null,
    archivedAt: null,
    createdAt: new Date('2026-06-08T10:00:00.000Z'),
    updatedAt: new Date('2026-06-08T10:00:00.000Z'),
    audiences: [
      {
        id: '40000000-0000-0000-0000-000000000002',
        audienceType: 'role',
        audienceRole: 'user',
        organisationId: null,
        region: null,
      },
    ],
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      publish: jest.fn(),
      archive: jest.fn(),
      cancel: jest.fn(),
    } as unknown as jest.Mocked<BroadcastsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BroadcastsController],
      providers: [{ provide: BroadcastsService, useValue: service }],
    }).compile();

    controller = module.get<BroadcastsController>(BroadcastsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list broadcasts', async () => {
    const query: BroadcastQueryDto = { status: 'draft' };
    service.findAll.mockResolvedValue([broadcast]);

    await expect(controller.findAll(query)).resolves.toEqual([broadcast]);
    expect(service.findAll.mock.calls[0]).toEqual([query]);
  });

  it('should get one broadcast', async () => {
    service.findOne.mockResolvedValue(broadcast);

    await expect(controller.findOne(broadcast.id)).resolves.toEqual(broadcast);
    expect(service.findOne.mock.calls[0]).toEqual([broadcast.id]);
  });

  it('should create one broadcast', async () => {
    const dto: CreateBroadcastDto = {
      title: broadcast.title,
      message: broadcast.message,
      broadcastType: broadcast.broadcastType,
      severity: broadcast.severity,
      audiences: [{ audienceType: 'role', audienceRole: 'user' }],
    };
    service.create.mockResolvedValue(broadcast);

    await expect(controller.create(dto)).resolves.toEqual(broadcast);
    expect(service.create.mock.calls[0]).toEqual([dto]);
  });

  it('should update one broadcast', async () => {
    const dto: UpdateBroadcastDto = { title: 'Updated warning' };
    service.update.mockResolvedValue({ ...broadcast, title: dto.title! });

    await expect(controller.update(broadcast.id, dto)).resolves.toMatchObject({
      title: dto.title,
    });
    expect(service.update.mock.calls[0]).toEqual([broadcast.id, dto]);
  });

  it('should publish one broadcast', async () => {
    service.publish.mockResolvedValue({ ...broadcast, status: 'published' });

    await expect(controller.publish(broadcast.id)).resolves.toMatchObject({
      status: 'published',
    });
    expect(service.publish.mock.calls[0]).toEqual([broadcast.id]);
  });

  it('should archive one broadcast', async () => {
    service.archive.mockResolvedValue({ ...broadcast, status: 'archived' });

    await expect(controller.archive(broadcast.id)).resolves.toMatchObject({
      status: 'archived',
    });
    expect(service.archive.mock.calls[0]).toEqual([broadcast.id]);
  });

  it('should cancel one broadcast', async () => {
    service.cancel.mockResolvedValue({ ...broadcast, status: 'cancelled' });

    await expect(controller.cancel(broadcast.id)).resolves.toMatchObject({
      status: 'cancelled',
    });
    expect(service.cancel.mock.calls[0]).toEqual([broadcast.id]);
  });
});
