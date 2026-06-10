import { Test, TestingModule } from '@nestjs/testing';
import { CreateVolunteerSourceDto } from './dto/create-volunteer-source.dto';
import { UpdateVolunteerSourceDto } from './dto/update-volunteer-source.dto';
import { UpsertVolunteerOpportunityDto } from './dto/upsert-volunteer-opportunity.dto';
import { VolunteerOpportunityQueryDto } from './dto/volunteer-opportunity-query.dto';
import { VolunteerOpportunityResponseDto } from './dto/volunteer-opportunity-response.dto';
import { VolunteerSourceResponseDto } from './dto/volunteer-source-response.dto';
import { VolunteerController } from './volunteer.controller';
import { VolunteerService } from './volunteer.service';

describe('VolunteerController', () => {
  let controller: VolunteerController;
  let service: jest.Mocked<VolunteerService>;

  const source: VolunteerSourceResponseDto = {
    id: '60000000-0000-0000-0000-000000000001',
    sourceName: 'SG Volunteer Portal',
    sourceUrl: 'https://volunteer.example.sg',
    organisationId: '10000000-0000-0000-0000-000000000001',
    isActive: true,
    lastSyncedAt: null,
    createdAt: new Date('2026-06-08T10:00:00.000Z'),
    updatedAt: new Date('2026-06-08T10:00:00.000Z'),
  };

  const opportunity: VolunteerOpportunityResponseDto = {
    id: '70000000-0000-0000-0000-000000000001',
    sourceId: source.id,
    externalId: 'external-event-123',
    title: 'Flood Relief Packing Support',
    description: 'Help pack supplies for affected residents.',
    opportunityType: 'flood_relief',
    urgency: 'urgent',
    location: 'Tampines Community Hub',
    region: 'East',
    startAt: new Date('2026-06-12T09:00:00.000Z'),
    endAt: new Date('2026-06-12T13:00:00.000Z'),
    slotsTotal: 20,
    slotsFilled: 8,
    slotsLeft: 12,
    slotProgress: 0.4,
    requiresTraining: false,
    signupUrl: 'https://volunteer.example.sg/events/123',
    sourceUrl: 'https://volunteer.example.sg/events/123',
    externalUpdatedAt: new Date('2026-06-08T11:00:00.000Z'),
    status: 'open',
    createdAt: new Date('2026-06-08T10:00:00.000Z'),
    updatedAt: new Date('2026-06-08T10:00:00.000Z'),
    source,
  };

  beforeEach(async () => {
    service = {
      findSources: jest.fn(),
      createSource: jest.fn(),
      updateSource: jest.fn(),
      findOpportunities: jest.fn(),
      findOpportunity: jest.fn(),
      upsertOpportunity: jest.fn(),
    } as unknown as jest.Mocked<VolunteerService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VolunteerController],
      providers: [{ provide: VolunteerService, useValue: service }],
    }).compile();

    controller = module.get<VolunteerController>(VolunteerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list opportunities', async () => {
    const query: VolunteerOpportunityQueryDto = { region: 'East' };
    service.findOpportunities.mockResolvedValue([opportunity]);

    await expect(controller.findOpportunities(query)).resolves.toEqual([
      opportunity,
    ]);
    expect(service.findOpportunities.mock.calls[0]).toEqual([query]);
  });

  it('should get one opportunity', async () => {
    service.findOpportunity.mockResolvedValue(opportunity);

    await expect(controller.findOpportunity(opportunity.id)).resolves.toEqual(
      opportunity,
    );
    expect(service.findOpportunity.mock.calls[0]).toEqual([opportunity.id]);
  });

  it('should upsert one opportunity', async () => {
    const dto: UpsertVolunteerOpportunityDto = {
      sourceId: source.id,
      externalId: opportunity.externalId,
      title: opportunity.title,
      signupUrl: opportunity.signupUrl,
    };
    service.upsertOpportunity.mockResolvedValue(opportunity);

    await expect(controller.upsertOpportunity(dto)).resolves.toEqual(
      opportunity,
    );
    expect(service.upsertOpportunity.mock.calls[0]).toEqual([dto]);
  });

  it('should list sources', async () => {
    service.findSources.mockResolvedValue([source]);

    await expect(controller.findSources()).resolves.toEqual([source]);
  });

  it('should create one source', async () => {
    const dto: CreateVolunteerSourceDto = {
      sourceName: source.sourceName,
      sourceUrl: source.sourceUrl,
    };
    service.createSource.mockResolvedValue(source);

    await expect(controller.createSource(dto)).resolves.toEqual(source);
    expect(service.createSource.mock.calls[0]).toEqual([dto]);
  });

  it('should update one source', async () => {
    const dto: UpdateVolunteerSourceDto = { isActive: false };
    service.updateSource.mockResolvedValue({ ...source, isActive: false });

    await expect(
      controller.updateSource(source.id, dto),
    ).resolves.toMatchObject({
      isActive: false,
    });
    expect(service.updateSource.mock.calls[0]).toEqual([source.id, dto]);
  });
});
