import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { organisations as OrganisationModel } from '../../generated/prisma/client';
import { OrganisationsRepository } from './organisations.repository';
import { OrganisationsService } from './organisations.service';

describe('OrganisationsService', () => {
  let service: OrganisationsService;
  let repository: jest.Mocked<OrganisationsRepository>;

  const organisationModel: OrganisationModel = {
    id: '10000000-0000-0000-0000-000000000001',
    org_name: 'SCDF Central Division',
  };

  beforeEach(() => {
    repository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByName: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<OrganisationsRepository>;

    service = new OrganisationsService(repository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should list mapped organisations with filters', async () => {
    repository.findMany.mockResolvedValue([organisationModel]);

    await expect(
      service.findAll({ search: 'SCDF', take: '10', skip: '0' }),
    ).resolves.toEqual([
      {
        id: organisationModel.id,
        orgName: organisationModel.org_name,
      },
    ]);
    expect(repository.findMany.mock.calls[0]).toEqual([
      {
        search: 'SCDF',
        take: 10,
        skip: 0,
      },
    ]);
  });

  it('should reject invalid pagination values', async () => {
    await expect(service.findAll({ take: '-1' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('should get one mapped organisation', async () => {
    repository.findById.mockResolvedValue(organisationModel);

    await expect(service.findOne(organisationModel.id)).resolves.toEqual({
      id: organisationModel.id,
      orgName: organisationModel.org_name,
    });
  });

  it('should throw when organisation is not found', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(service.findOne(organisationModel.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should create one organisation', async () => {
    repository.findByName.mockResolvedValue(null);
    repository.create.mockResolvedValue(organisationModel);

    await expect(
      service.create({ orgName: '  SCDF Central Division  ' }),
    ).resolves.toEqual({
      id: organisationModel.id,
      orgName: organisationModel.org_name,
    });
    expect(repository.create.mock.calls[0]).toEqual([
      {
        org_name: organisationModel.org_name,
      },
    ]);
  });

  it('should reject duplicate organisation names on create', async () => {
    repository.findByName.mockResolvedValue(organisationModel);

    await expect(
      service.create({ orgName: organisationModel.org_name }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('should update one organisation', async () => {
    repository.findById.mockResolvedValue(organisationModel);
    repository.findByName.mockResolvedValue(null);
    repository.update.mockResolvedValue({
      ...organisationModel,
      org_name: 'SCDF East Division',
    });

    await expect(
      service.update(organisationModel.id, { orgName: 'SCDF East Division' }),
    ).resolves.toEqual({
      id: organisationModel.id,
      orgName: 'SCDF East Division',
    });
    expect(repository.update.mock.calls[0]).toEqual([
      organisationModel.id,
      {
        org_name: 'SCDF East Division',
      },
    ]);
  });

  it('should reject duplicate organisation names on update', async () => {
    repository.findById.mockResolvedValue(organisationModel);
    repository.findByName.mockResolvedValue({
      id: '10000000-0000-0000-0000-000000000002',
      org_name: 'SCDF East Division',
    });

    await expect(
      service.update(organisationModel.id, { orgName: 'SCDF East Division' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
