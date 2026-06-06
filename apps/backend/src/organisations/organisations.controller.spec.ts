import { Test, TestingModule } from '@nestjs/testing';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { OrganisationQueryDto } from './dto/organisation-query.dto';
import { OrganisationResponseDto } from './dto/organisation-response.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsService } from './organisations.service';

describe('OrganisationsController', () => {
  let controller: OrganisationsController;
  let service: jest.Mocked<OrganisationsService>;

  const organisation: OrganisationResponseDto = {
    id: '10000000-0000-0000-0000-000000000001',
    orgName: 'SCDF Central Division',
  };

  beforeEach(async () => {
    service = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<OrganisationsService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganisationsController],
      providers: [{ provide: OrganisationsService, useValue: service }],
    }).compile();

    controller = module.get<OrganisationsController>(OrganisationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should list organisations', async () => {
    const query: OrganisationQueryDto = { search: 'SCDF' };
    service.findAll.mockResolvedValue([organisation]);

    await expect(controller.findAll(query)).resolves.toEqual([organisation]);
    expect(service.findAll.mock.calls[0]).toEqual([query]);
  });

  it('should get one organisation', async () => {
    service.findOne.mockResolvedValue(organisation);

    await expect(controller.findOne(organisation.id)).resolves.toEqual(
      organisation,
    );
    expect(service.findOne.mock.calls[0]).toEqual([organisation.id]);
  });

  it('should create one organisation', async () => {
    const dto: CreateOrganisationDto = { orgName: organisation.orgName };
    service.create.mockResolvedValue(organisation);

    await expect(controller.create(dto)).resolves.toEqual(organisation);
    expect(service.create.mock.calls[0]).toEqual([dto]);
  });

  it('should update one organisation', async () => {
    const dto: UpdateOrganisationDto = { orgName: 'SCDF East Division' };
    service.update.mockResolvedValue({
      ...organisation,
      orgName: dto.orgName!,
    });

    await expect(controller.update(organisation.id, dto)).resolves.toEqual({
      ...organisation,
      orgName: dto.orgName,
    });
    expect(service.update.mock.calls[0]).toEqual([organisation.id, dto]);
  });
});
