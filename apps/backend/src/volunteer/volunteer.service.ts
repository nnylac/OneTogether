import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { CreateVolunteerSourceDto } from './dto/create-volunteer-source.dto';
import { UpdateVolunteerSourceDto } from './dto/update-volunteer-source.dto';
import { UpsertVolunteerOpportunityDto } from './dto/upsert-volunteer-opportunity.dto';
import { VolunteerOpportunityQueryDto } from './dto/volunteer-opportunity-query.dto';
import { VolunteerOpportunityResponseDto } from './dto/volunteer-opportunity-response.dto';
import { VolunteerSourceResponseDto } from './dto/volunteer-source-response.dto';
import {
  FindVolunteerOpportunitiesFilters,
  VolunteerRepository,
} from './volunteer.repository';

@Injectable()
export class VolunteerService {
  constructor(private readonly volunteerRepository: VolunteerRepository) {}

  async findSources(): Promise<VolunteerSourceResponseDto[]> {
    const sources = await this.volunteerRepository.findSources();
    return sources.map((source) =>
      VolunteerSourceResponseDto.fromModel(source),
    );
  }

  async createSource(
    dto: CreateVolunteerSourceDto,
  ): Promise<VolunteerSourceResponseDto> {
    this.validateSourceDto(dto);
    await this.ensureSourceUrlIsAvailable(dto.sourceUrl.trim());

    const source = await this.volunteerRepository.createSource({
      source_name: dto.sourceName.trim(),
      source_url: dto.sourceUrl.trim(),
      organisations:
        dto.organisationId === undefined
          ? undefined
          : { connect: { id: dto.organisationId } },
      is_active: dto.isActive ?? true,
    });

    return VolunteerSourceResponseDto.fromModel(source);
  }

  async updateSource(
    id: string,
    dto: UpdateVolunteerSourceDto,
  ): Promise<VolunteerSourceResponseDto> {
    await this.ensureSourceExists(id);
    this.validateUpdateSourceDto(dto);

    if (dto.sourceUrl !== undefined) {
      await this.ensureSourceUrlIsAvailable(dto.sourceUrl.trim(), id);
    }

    const source = await this.volunteerRepository.updateSource(
      id,
      this.toSourceUpdateInput(dto),
    );

    return VolunteerSourceResponseDto.fromModel(source);
  }

  async findOpportunities(
    query: VolunteerOpportunityQueryDto = {},
  ): Promise<VolunteerOpportunityResponseDto[]> {
    const opportunities = await this.volunteerRepository.findOpportunities(
      this.toOpportunityFilters(query),
    );
    return opportunities
      .map((opportunity) =>
        VolunteerOpportunityResponseDto.fromModel(opportunity),
      )
      .sort((first, second) => {
        const urgencyDelta =
          this.toUrgencyRank(first.urgency) -
          this.toUrgencyRank(second.urgency);

        if (urgencyDelta !== 0) {
          return urgencyDelta;
        }

        return (
          this.toSortableTime(first.startAt) -
          this.toSortableTime(second.startAt)
        );
      });
  }

  async findOpportunity(id: string): Promise<VolunteerOpportunityResponseDto> {
    const opportunity = await this.volunteerRepository.findOpportunityById(id);

    if (!opportunity) {
      throw new NotFoundException('Volunteer opportunity not found');
    }

    return VolunteerOpportunityResponseDto.fromModel(opportunity);
  }

  async upsertOpportunity(
    dto: UpsertVolunteerOpportunityDto,
  ): Promise<VolunteerOpportunityResponseDto> {
    this.validateOpportunityDto(dto);
    await this.ensureSourceExists(dto.sourceId);

    const opportunity = await this.volunteerRepository.upsertOpportunity(
      dto.sourceId,
      dto.externalId.trim(),
      this.toOpportunityUpsertInput(dto),
    );

    return VolunteerOpportunityResponseDto.fromModel(opportunity);
  }

  private async ensureSourceExists(id: string): Promise<void> {
    const source = await this.volunteerRepository.findSourceById(id);

    if (!source) {
      throw new NotFoundException('Volunteer source not found');
    }
  }

  private async ensureSourceUrlIsAvailable(
    sourceUrl: string,
    currentSourceId?: string,
  ): Promise<void> {
    const existingSource =
      await this.volunteerRepository.findSourceByUrl(sourceUrl);

    if (existingSource && existingSource.id !== currentSourceId) {
      throw new ConflictException('Volunteer source URL already exists');
    }
  }

  private validateSourceDto(dto: CreateVolunteerSourceDto): void {
    this.validateRequiredString(dto.sourceName, 'sourceName', 100);
    this.validateRequiredString(dto.sourceUrl, 'sourceUrl');
  }

  private validateUpdateSourceDto(dto: UpdateVolunteerSourceDto): void {
    this.validateOptionalString(dto.sourceName, 'sourceName', 100);
    this.validateOptionalString(dto.sourceUrl, 'sourceUrl');
  }

  private validateOpportunityDto(dto: UpsertVolunteerOpportunityDto): void {
    this.validateRequiredString(dto.sourceId, 'sourceId');
    this.validateRequiredString(dto.externalId, 'externalId');
    this.validateRequiredString(dto.title, 'title', 150);
    this.validateRequiredString(dto.signupUrl, 'signupUrl');
    this.validateOptionalString(dto.description, 'description');
    this.validateOptionalString(dto.opportunityType, 'opportunityType', 50);
    this.validateUrgency(dto.urgency);
    this.validateOptionalString(dto.location, 'location');
    this.validateOptionalString(dto.region, 'region', 100);
    this.validateOptionalString(dto.sourceUrl, 'sourceUrl');
    this.parseOptionalDate(dto.startAt, 'startAt');
    this.parseOptionalDate(dto.endAt, 'endAt');
    this.parseOptionalDate(dto.externalUpdatedAt, 'externalUpdatedAt');
  }

  private toOpportunityFilters(
    query: VolunteerOpportunityQueryDto,
  ): FindVolunteerOpportunitiesFilters {
    return {
      sourceId: query.sourceId,
      region: query.region,
      opportunityType: query.opportunityType,
      urgency: query.urgency,
      status: query.status,
      search: query.search,
      take: this.parseNumber(query.take, 'take'),
      skip: this.parseNumber(query.skip, 'skip'),
    };
  }

  private toSourceUpdateInput(
    dto: UpdateVolunteerSourceDto,
  ): Prisma.volunteer_sourcesUpdateInput {
    return {
      source_name:
        dto.sourceName === undefined ? undefined : dto.sourceName.trim(),
      source_url:
        dto.sourceUrl === undefined ? undefined : dto.sourceUrl.trim(),
      organisations:
        dto.organisationId === undefined
          ? undefined
          : dto.organisationId === null
            ? { disconnect: true }
            : { connect: { id: dto.organisationId } },
      is_active: this.parseBoolean(dto.isActive, 'isActive'),
      last_synced_at: this.parseNullableDate(dto.lastSyncedAt, 'lastSyncedAt'),
    };
  }

  private toOpportunityUpsertInput(
    dto: UpsertVolunteerOpportunityDto,
  ): Omit<Prisma.volunteer_opportunitiesUncheckedCreateInput, 'id'> {
    return {
      source_id: dto.sourceId,
      external_id: dto.externalId.trim(),
      title: dto.title.trim(),
      description: this.normalizeOptionalString(dto.description),
      opportunity_type: this.normalizeOptionalString(dto.opportunityType),
      urgency: dto.urgency?.trim() ?? 'normal',
      location: this.normalizeOptionalString(dto.location),
      region: this.normalizeOptionalString(dto.region),
      start_at: this.parseOptionalDate(dto.startAt, 'startAt'),
      end_at: this.parseOptionalDate(dto.endAt, 'endAt'),
      slots_total: this.parseNullableNumber(dto.slotsTotal, 'slotsTotal'),
      slots_filled: this.parseNumber(dto.slotsFilled, 'slotsFilled') ?? 0,
      requires_training:
        this.parseBoolean(dto.requiresTraining, 'requiresTraining') ?? false,
      signup_url: dto.signupUrl.trim(),
      source_url: this.normalizeOptionalString(dto.sourceUrl),
      external_updated_at: this.parseOptionalDate(
        dto.externalUpdatedAt,
        'externalUpdatedAt',
      ),
      opportunity_status: dto.status?.trim() ?? 'open',
    };
  }

  private validateRequiredString(
    value: string | undefined,
    field: string,
    maxLength?: number,
  ): void {
    if (value === undefined || !value.trim()) {
      throw new BadRequestException(`${field} cannot be empty`);
    }

    if (maxLength !== undefined && value.trim().length > maxLength) {
      throw new BadRequestException(
        `${field} cannot exceed ${maxLength} characters`,
      );
    }
  }

  private validateOptionalString(
    value: string | undefined,
    field: string,
    maxLength?: number,
  ): void {
    if (value === undefined) {
      return;
    }

    this.validateRequiredString(value, field, maxLength);
  }

  private normalizeOptionalString(
    value: string | undefined,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value.trim();
  }

  private parseOptionalDate(
    value: Date | string | undefined,
    field: string,
  ): Date | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }

    const parsed = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`${field} must be a valid date`);
    }

    return parsed;
  }

  private parseNullableDate(
    value: Date | string | null | undefined,
    field: string,
  ): Date | null | undefined {
    if (value === null) {
      return null;
    }

    return this.parseOptionalDate(value, field);
  }

  private parseNullableNumber(
    value: number | string | null | undefined,
    field: string,
  ): number | null | undefined {
    if (value === null) {
      return null;
    }

    return this.parseNumber(value, field);
  }

  private validateUrgency(value: string | undefined): void {
    if (
      value === undefined ||
      value === 'normal' ||
      value === 'urgent' ||
      value === 'critical'
    ) {
      return;
    }

    throw new BadRequestException(
      'urgency must be normal, urgent, or critical',
    );
  }

  private toUrgencyRank(urgency: string): number {
    if (urgency === 'critical') {
      return 0;
    }

    if (urgency === 'urgent') {
      return 1;
    }

    return 2;
  }

  private toSortableTime(value: Date | null): number {
    return value?.getTime() ?? Number.MAX_SAFE_INTEGER;
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
