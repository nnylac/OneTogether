import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import type {
  BroadcastAudienceDto,
  BroadcastAudienceType,
} from './dto/broadcast-audience.dto';
import { BroadcastQueryDto } from './dto/broadcast-query.dto';
import {
  BroadcastResponseDto,
  BroadcastWithAudiences,
} from './dto/broadcast-response.dto';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';
import {
  BroadcastsRepository,
  FindBroadcastsFilters,
} from './broadcasts.repository';

@Injectable()
export class BroadcastsService {
  private readonly allowedAudienceTypes = new Set([
    'public',
    'role',
    'organisation',
    'region',
  ]);
  private readonly allowedSeverities = new Set([
    'info',
    'advisory',
    'warning',
    'critical',
  ]);
  private readonly allowedStatuses = new Set([
    'draft',
    'published',
    'archived',
    'cancelled',
  ]);

  constructor(private readonly broadcastsRepository: BroadcastsRepository) {}

  async findAll(
    query: BroadcastQueryDto = {},
  ): Promise<BroadcastResponseDto[]> {
    const broadcasts = await this.broadcastsRepository.findMany(
      this.toFilters(query),
    );
    return broadcasts.map((broadcast) =>
      BroadcastResponseDto.fromModel(broadcast),
    );
  }

  async findOne(id: string): Promise<BroadcastResponseDto> {
    const broadcast = await this.broadcastsRepository.findById(id);

    if (!broadcast) {
      throw new NotFoundException('Broadcast not found');
    }

    return BroadcastResponseDto.fromModel(broadcast);
  }

  async create(dto: CreateBroadcastDto): Promise<BroadcastResponseDto> {
    this.validateCreateDto(dto);

    const broadcast = await this.broadcastsRepository.create({
      title: dto.title.trim(),
      message: dto.message.trim(),
      broadcast_type: dto.broadcastType.trim(),
      severity: dto.severity ?? 'info',
      users:
        dto.createdByUserId === undefined
          ? undefined
          : { connect: { id: dto.createdByUserId } },
      broadcast_audiences: {
        create: dto.audiences.map((audience) =>
          this.toAudienceNestedCreateInput(audience),
        ),
      },
    });

    return BroadcastResponseDto.fromModel(broadcast);
  }

  async update(
    id: string,
    dto: UpdateBroadcastDto,
  ): Promise<BroadcastResponseDto> {
    const currentBroadcast = await this.ensureExists(id);

    if (currentBroadcast.broadcast_status !== 'draft') {
      throw new BadRequestException('Only draft broadcasts can be updated');
    }

    this.validateUpdateDto(dto);

    let broadcast = await this.broadcastsRepository.update(
      id,
      this.toUpdateInput(dto),
    );

    if (dto.audiences !== undefined) {
      broadcast = await this.broadcastsRepository.replaceAudiences(
        id,
        dto.audiences.map((audience) =>
          this.toAudienceCreateManyInput(id, audience),
        ),
      );
    }

    return BroadcastResponseDto.fromModel(broadcast);
  }

  async publish(id: string): Promise<BroadcastResponseDto> {
    const broadcast = await this.ensureExists(id);

    if (broadcast.broadcast_status !== 'draft') {
      throw new BadRequestException('Only draft broadcasts can be published');
    }

    if (broadcast.broadcast_audiences.length === 0) {
      throw new BadRequestException(
        'Broadcast must have at least one audience',
      );
    }

    const publishedBroadcast = await this.broadcastsRepository.update(id, {
      broadcast_status: 'published',
      published_at: new Date(),
    });

    return BroadcastResponseDto.fromModel(publishedBroadcast);
  }

  async archive(id: string): Promise<BroadcastResponseDto> {
    const broadcast = await this.ensureExists(id);

    if (broadcast.broadcast_status !== 'published') {
      throw new BadRequestException(
        'Only published broadcasts can be archived',
      );
    }

    const archivedBroadcast = await this.broadcastsRepository.update(id, {
      broadcast_status: 'archived',
      archived_at: new Date(),
    });

    return BroadcastResponseDto.fromModel(archivedBroadcast);
  }

  async cancel(id: string): Promise<BroadcastResponseDto> {
    const broadcast = await this.ensureExists(id);

    if (broadcast.broadcast_status !== 'draft') {
      throw new BadRequestException('Only draft broadcasts can be cancelled');
    }

    const cancelledBroadcast = await this.broadcastsRepository.update(id, {
      broadcast_status: 'cancelled',
    });

    return BroadcastResponseDto.fromModel(cancelledBroadcast);
  }

  private async ensureExists(id: string): Promise<BroadcastWithAudiences> {
    const broadcast = await this.broadcastsRepository.findById(id);

    if (!broadcast) {
      throw new NotFoundException('Broadcast not found');
    }

    return broadcast;
  }

  private validateCreateDto(dto: CreateBroadcastDto): void {
    this.validateRequiredString(dto.title, 'title', 120);
    this.validateRequiredString(dto.message, 'message');
    this.validateRequiredString(dto.broadcastType, 'broadcastType', 50);
    this.validateSeverity(dto.severity ?? 'info');
    this.validateAudiences(dto.audiences);
  }

  private validateUpdateDto(dto: UpdateBroadcastDto): void {
    this.validateOptionalString(dto.title, 'title', 120);
    this.validateOptionalString(dto.message, 'message');
    this.validateOptionalString(dto.broadcastType, 'broadcastType', 50);

    if (dto.severity !== undefined) {
      this.validateSeverity(dto.severity);
    }

    if (dto.audiences !== undefined) {
      this.validateAudiences(dto.audiences);
    }
  }

  private validateAudiences(
    audiences: BroadcastAudienceDto[] | undefined,
  ): void {
    if (!Array.isArray(audiences) || audiences.length === 0) {
      throw new BadRequestException('audiences must include at least one item');
    }

    audiences.forEach((audience) => this.validateAudience(audience));
  }

  private validateAudience(audience: BroadcastAudienceDto): void {
    if (!this.isAllowedAudienceType(audience.audienceType)) {
      throw new BadRequestException('Invalid audienceType');
    }

    if (audience.audienceType === 'public') {
      this.ensureOnlyFields(audience, []);
      return;
    }

    if (audience.audienceType === 'role') {
      this.validateRequiredString(audience.audienceRole, 'audienceRole', 50);
      this.ensureOnlyFields(audience, ['audienceRole']);
      return;
    }

    if (audience.audienceType === 'organisation') {
      this.validateRequiredString(audience.organisationId, 'organisationId');
      this.ensureOnlyFields(audience, ['organisationId']);
      return;
    }

    this.validateRequiredString(audience.region, 'region', 100);
    this.ensureOnlyFields(audience, ['region']);
  }

  private ensureOnlyFields(
    audience: BroadcastAudienceDto,
    allowedFields: Array<keyof BroadcastAudienceDto>,
  ): void {
    const optionalFields: Array<keyof BroadcastAudienceDto> = [
      'audienceRole',
      'organisationId',
      'region',
    ];
    const invalidField = optionalFields.find(
      (field) =>
        !allowedFields.includes(field) && audience[field] !== undefined,
    );

    if (invalidField) {
      throw new BadRequestException(
        `${invalidField} is not valid for ${audience.audienceType} audiences`,
      );
    }
  }

  private toFilters(query: BroadcastQueryDto): FindBroadcastsFilters {
    if (query.status !== undefined && !this.allowedStatuses.has(query.status)) {
      throw new BadRequestException('Invalid broadcast status');
    }

    if (query.severity !== undefined) {
      this.validateSeverity(query.severity);
    }

    if (
      query.audienceType !== undefined &&
      !this.isAllowedAudienceType(query.audienceType)
    ) {
      throw new BadRequestException('Invalid audienceType');
    }

    return {
      status: query.status,
      severity: query.severity,
      broadcastType: query.broadcastType,
      audienceType: query.audienceType,
      audienceRole: query.audienceRole,
      organisationId: query.organisationId,
      region: query.region,
      take: this.parseNumber(query.take, 'take'),
      skip: this.parseNumber(query.skip, 'skip'),
    };
  }

  private toUpdateInput(dto: UpdateBroadcastDto): Prisma.broadcastsUpdateInput {
    return {
      title: dto.title === undefined ? undefined : dto.title.trim(),
      message: dto.message === undefined ? undefined : dto.message.trim(),
      broadcast_type:
        dto.broadcastType === undefined ? undefined : dto.broadcastType.trim(),
      severity: dto.severity,
    };
  }

  private toAudienceNestedCreateInput(
    audience: BroadcastAudienceDto,
  ): Prisma.broadcast_audiencesCreateWithoutBroadcastsInput {
    return {
      audience_type: audience.audienceType,
      audience_role:
        audience.audienceType === 'role'
          ? audience.audienceRole?.trim()
          : undefined,
      organisations:
        audience.audienceType === 'organisation'
          ? { connect: { id: audience.organisationId } }
          : undefined,
      region:
        audience.audienceType === 'region'
          ? audience.region?.trim()
          : undefined,
    };
  }

  private toAudienceCreateManyInput(
    broadcastId: string,
    audience: BroadcastAudienceDto,
  ): Prisma.broadcast_audiencesCreateManyInput {
    return {
      broadcast_id: broadcastId,
      audience_type: audience.audienceType,
      audience_role:
        audience.audienceType === 'role'
          ? audience.audienceRole?.trim()
          : undefined,
      organisation_id:
        audience.audienceType === 'organisation'
          ? audience.organisationId
          : undefined,
      region:
        audience.audienceType === 'region'
          ? audience.region?.trim()
          : undefined,
    };
  }

  private isAllowedAudienceType(
    audienceType: string | undefined,
  ): audienceType is BroadcastAudienceType {
    return (
      audienceType !== undefined && this.allowedAudienceTypes.has(audienceType)
    );
  }

  private validateSeverity(severity: string): void {
    if (!this.allowedSeverities.has(severity)) {
      throw new BadRequestException('Invalid broadcast severity');
    }
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
