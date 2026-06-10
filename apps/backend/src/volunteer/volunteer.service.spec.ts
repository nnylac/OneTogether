import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type {
  volunteer_opportunities as VolunteerOpportunityModel,
  volunteer_sources as VolunteerSourceModel,
} from '../../generated/prisma/client';
import { VolunteerRepository } from './volunteer.repository';
import { VolunteerService } from './volunteer.service';

describe('VolunteerService', () => {
  let service: VolunteerService;
  let repository: jest.Mocked<VolunteerRepository>;

  const sourceModel: VolunteerSourceModel = {
    id: '60000000-0000-0000-0000-000000000001',
    source_name: 'SG Volunteer Portal',
    source_url: 'https://volunteer.example.sg',
    organisation_id: '10000000-0000-0000-0000-000000000001',
    is_active: true,
    last_synced_at: null,
    created_at: new Date('2026-06-08T10:00:00.000Z'),
    updated_at: new Date('2026-06-08T10:00:00.000Z'),
  };

  const opportunityModel: VolunteerOpportunityModel & {
    volunteer_sources: VolunteerSourceModel;
  } = {
    id: '70000000-0000-0000-0000-000000000001',
    source_id: sourceModel.id,
    external_id: 'external-event-123',
    title: 'Flood Relief Packing Support',
    description: 'Help pack supplies for affected residents.',
    opportunity_type: 'flood_relief',
    urgency: 'urgent',
    location: 'Tampines Community Hub',
    region: 'East',
    start_at: new Date('2026-06-12T09:00:00.000Z'),
    end_at: new Date('2026-06-12T13:00:00.000Z'),
    slots_total: 20,
    slots_filled: 8,
    requires_training: false,
    signup_url: 'https://volunteer.example.sg/events/123',
    source_url: 'https://volunteer.example.sg/events/123',
    external_updated_at: new Date('2026-06-08T11:00:00.000Z'),
    opportunity_status: 'open',
    created_at: new Date('2026-06-08T10:00:00.000Z'),
    updated_at: new Date('2026-06-08T10:00:00.000Z'),
    volunteer_sources: sourceModel,
  };

  beforeEach(() => {
    repository = {
      findSources: jest.fn(),
      findSourceById: jest.fn(),
      findSourceByUrl: jest.fn(),
      createSource: jest.fn(),
      updateSource: jest.fn(),
      findOpportunities: jest.fn(),
      findOpportunityById: jest.fn(),
      upsertOpportunity: jest.fn(),
    } as unknown as jest.Mocked<VolunteerRepository>;

    service = new VolunteerService(repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list volunteer sources', async () => {
    repository.findSources.mockResolvedValue([sourceModel]);

    await expect(service.findSources()).resolves.toMatchObject([
      {
        id: sourceModel.id,
        sourceName: sourceModel.source_name,
        sourceUrl: sourceModel.source_url,
      },
    ]);
  });

  it('should create one source', async () => {
    repository.findSourceByUrl.mockResolvedValue(null);
    repository.createSource.mockResolvedValue(sourceModel);

    await expect(
      service.createSource({
        sourceName: '  SG Volunteer Portal  ',
        sourceUrl: sourceModel.source_url,
        organisationId: sourceModel.organisation_id!,
      }),
    ).resolves.toMatchObject({
      id: sourceModel.id,
      sourceName: sourceModel.source_name,
    });
    expect(repository.createSource.mock.calls[0]).toEqual([
      {
        source_name: sourceModel.source_name,
        source_url: sourceModel.source_url,
        organisations: {
          connect: {
            id: sourceModel.organisation_id,
          },
        },
        is_active: true,
      },
    ]);
  });

  it('should reject duplicate source URLs', async () => {
    repository.findSourceByUrl.mockResolvedValue(sourceModel);

    await expect(
      service.createSource({
        sourceName: sourceModel.source_name,
        sourceUrl: sourceModel.source_url,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should list mapped opportunities with filters', async () => {
    repository.findOpportunities.mockResolvedValue([opportunityModel]);

    await expect(
      service.findOpportunities({
        region: 'east',
        search: 'relief',
        take: '10',
        skip: '0',
      }),
    ).resolves.toMatchObject([
      {
        id: opportunityModel.id,
        title: opportunityModel.title,
        signupUrl: opportunityModel.signup_url,
        source: { sourceName: sourceModel.source_name },
      },
    ]);
    expect(repository.findOpportunities.mock.calls[0]).toEqual([
      {
        sourceId: undefined,
        region: 'east',
        opportunityType: undefined,
        status: undefined,
        search: 'relief',
        take: 10,
        skip: 0,
      },
    ]);
  });

  it('should throw when opportunity is not found', async () => {
    repository.findOpportunityById.mockResolvedValue(null);

    await expect(
      service.findOpportunity(opportunityModel.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('should upsert one external opportunity', async () => {
    repository.findSourceById.mockResolvedValue(sourceModel);
    repository.upsertOpportunity.mockResolvedValue(opportunityModel);

    await expect(
      service.upsertOpportunity({
        sourceId: sourceModel.id,
        externalId: opportunityModel.external_id,
        title: '  Flood Relief Packing Support  ',
        description: opportunityModel.description!,
        opportunityType: opportunityModel.opportunity_type!,
        location: opportunityModel.location!,
        region: opportunityModel.region!,
        startAt: opportunityModel.start_at!,
        endAt: opportunityModel.end_at!,
        signupUrl: opportunityModel.signup_url,
        sourceUrl: opportunityModel.source_url!,
        externalUpdatedAt: opportunityModel.external_updated_at!,
        status: 'open',
      }),
    ).resolves.toMatchObject({
      id: opportunityModel.id,
      externalId: opportunityModel.external_id,
    });
    expect(repository.upsertOpportunity.mock.calls[0]).toEqual([
      sourceModel.id,
      opportunityModel.external_id,
      {
        source_id: sourceModel.id,
        external_id: opportunityModel.external_id,
        title: opportunityModel.title,
        description: opportunityModel.description,
        opportunity_type: opportunityModel.opportunity_type,
        location: opportunityModel.location,
        region: opportunityModel.region,
        urgency: 'normal',
        start_at: opportunityModel.start_at,
        end_at: opportunityModel.end_at,
        slots_total: undefined,
        slots_filled: 0,
        requires_training: false,
        signup_url: opportunityModel.signup_url,
        source_url: opportunityModel.source_url,
        external_updated_at: opportunityModel.external_updated_at,
        opportunity_status: 'open',
      },
    ]);
  });

  it('should reject invalid dates', async () => {
    await expect(
      service.upsertOpportunity({
        sourceId: sourceModel.id,
        externalId: opportunityModel.external_id,
        title: opportunityModel.title,
        signupUrl: opportunityModel.signup_url,
        startAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
