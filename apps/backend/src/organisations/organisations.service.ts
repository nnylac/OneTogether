import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { organisations as OrganisationModel } from '../../generated/prisma/client';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { OrganisationQueryDto } from './dto/organisation-query.dto';
import { OrganisationResponseDto } from './dto/organisation-response.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import {
  FindOrganisationsFilters,
  OrganisationsRepository,
} from './organisations.repository';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly organisationsRepository: OrganisationsRepository,
  ) {}

  async findAll(
    query: OrganisationQueryDto = {},
  ): Promise<OrganisationResponseDto[]> {
    const organisations = await this.organisationsRepository.findMany(
      this.toFilters(query),
    );
    return organisations.map((organisation) =>
      OrganisationResponseDto.fromModel(organisation),
    );
  }

  async findOne(id: string): Promise<OrganisationResponseDto> {
    const organisation = await this.organisationsRepository.findById(id);

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return OrganisationResponseDto.fromModel(organisation);
  }

  async create(dto: CreateOrganisationDto): Promise<OrganisationResponseDto> {
    const orgName = this.normalizeOrgName(dto.orgName);
    await this.ensureNameIsAvailable(orgName);

    const organisation = await this.organisationsRepository.create({
      org_name: orgName,
    });

    return OrganisationResponseDto.fromModel(organisation);
  }

  async update(
    id: string,
    dto: UpdateOrganisationDto,
  ): Promise<OrganisationResponseDto> {
    const currentOrganisation = await this.ensureExists(id);

    if (dto.orgName !== undefined) {
      const orgName = this.normalizeOrgName(dto.orgName);
      await this.ensureNameIsAvailable(orgName, id);

      const organisation = await this.organisationsRepository.update(id, {
        org_name: orgName,
      });

      return OrganisationResponseDto.fromModel(organisation);
    }

    return OrganisationResponseDto.fromModel(currentOrganisation);
  }

  private async ensureExists(id: string): Promise<OrganisationModel> {
    const organisation = await this.organisationsRepository.findById(id);

    if (!organisation) {
      throw new NotFoundException('Organisation not found');
    }

    return organisation;
  }

  private async ensureNameIsAvailable(
    orgName: string,
    currentOrganisationId?: string,
  ): Promise<void> {
    const existingOrganisation =
      await this.organisationsRepository.findByName(orgName);

    if (
      existingOrganisation &&
      existingOrganisation.id !== currentOrganisationId
    ) {
      throw new ConflictException('Organisation name already exists');
    }
  }

  private toFilters(query: OrganisationQueryDto): FindOrganisationsFilters {
    return {
      search: query.search,
      take: this.parseNumber(query.take, 'take'),
      skip: this.parseNumber(query.skip, 'skip'),
    };
  }

  private normalizeOrgName(orgName: string): string {
    const normalizedName = orgName.trim();

    if (!normalizedName) {
      throw new BadRequestException('orgName cannot be empty');
    }

    if (normalizedName.length > 50) {
      throw new BadRequestException('orgName cannot exceed 50 characters');
    }

    return normalizedName;
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
