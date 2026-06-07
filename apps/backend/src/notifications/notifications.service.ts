import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { MarkNotificationsReadDto } from './dto/mark-notifications-read.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import type {
  NotificationRecipientDto,
  NotificationRecipientType,
} from './dto/notification-recipient.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import {
  FindNotificationsFilters,
  NotificationsRepository,
} from './notifications.repository';

@Injectable()
export class NotificationsService {
  private readonly allowedRecipientTypes = new Set([
    'user',
    'organisation',
    'role',
  ]);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async findAll(
    query: NotificationQueryDto = {},
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationsRepository.findMany(
      this.toFilters(query),
    );
    return notifications.map((notification) =>
      NotificationResponseDto.fromModel(notification),
    );
  }

  async findOne(id: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationsRepository.findById(id);

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return NotificationResponseDto.fromModel(notification);
  }

  async create(dto: CreateNotificationDto): Promise<NotificationResponseDto> {
    this.validateCreateDto(dto);

    const notification = await this.notificationsRepository.create({
      title: dto.title.trim(),
      message: dto.message.trim(),
      notification_type: dto.notificationType.trim(),
      reference_type: this.normalizeOptionalString(dto.referenceType),
      reference_id: this.normalizeOptionalString(dto.referenceId),
      notification_recipients: {
        create: dto.recipients.map((recipient) =>
          this.toRecipientCreateInput(recipient),
        ),
      },
    });

    return NotificationResponseDto.fromModel(notification);
  }

  async markRecipientAsRead(
    recipientId: string,
  ): Promise<{ id: string; isRead: boolean; readAt: Date | null }> {
    const recipient =
      await this.notificationsRepository.findRecipientById(recipientId);

    if (!recipient) {
      throw new NotFoundException('Notification recipient not found');
    }

    const updatedRecipient =
      await this.notificationsRepository.markRecipientAsRead(recipientId);

    return {
      id: updatedRecipient.id,
      isRead: updatedRecipient.is_read,
      readAt: updatedRecipient.read_at,
    };
  }

  async markAllAsRead(
    dto: MarkNotificationsReadDto,
  ): Promise<{ count: number }> {
    this.validateRecipientTarget(dto);

    const result = await this.notificationsRepository.markAllAsRead({
      recipientType: dto.recipientType,
      recipientId: dto.recipientId,
      recipientRole: dto.recipientRole,
      isRead: false,
    });

    return { count: result.count };
  }

  private validateCreateDto(dto: CreateNotificationDto): void {
    this.validateRequiredString(dto.title, 'title', 120);
    this.validateRequiredString(dto.message, 'message');
    this.validateRequiredString(dto.notificationType, 'notificationType', 50);
    this.validateOptionalString(dto.referenceType, 'referenceType', 50);

    if (!Array.isArray(dto.recipients) || dto.recipients.length === 0) {
      throw new BadRequestException(
        'recipients must include at least one item',
      );
    }

    dto.recipients.forEach((recipient) =>
      this.validateRecipientTarget(recipient),
    );
  }

  private validateRecipientTarget(
    recipient: NotificationRecipientDto | MarkNotificationsReadDto,
  ): void {
    if (!this.isAllowedRecipientType(recipient.recipientType)) {
      throw new BadRequestException('Invalid recipientType');
    }

    if (recipient.recipientType === 'role') {
      this.validateRequiredString(recipient.recipientRole, 'recipientRole', 50);

      if (recipient.recipientId !== undefined) {
        throw new BadRequestException(
          'recipientId must not be provided for role recipients',
        );
      }

      return;
    }

    this.validateRequiredString(recipient.recipientId, 'recipientId');

    if (recipient.recipientRole !== undefined) {
      throw new BadRequestException(
        'recipientRole must only be provided for role recipients',
      );
    }
  }

  private toFilters(query: NotificationQueryDto): FindNotificationsFilters {
    if (
      query.recipientType !== undefined &&
      !this.isAllowedRecipientType(query.recipientType)
    ) {
      throw new BadRequestException('Invalid recipientType');
    }

    return {
      recipientType: query.recipientType,
      recipientId: query.recipientId,
      recipientRole: query.recipientRole,
      isRead: this.parseBoolean(query.isRead, 'isRead'),
      notificationType: query.notificationType,
      take: this.parseNumber(query.take, 'take'),
      skip: this.parseNumber(query.skip, 'skip'),
    };
  }

  private toRecipientCreateInput(
    recipient: NotificationRecipientDto,
  ): Prisma.notification_recipientsCreateWithoutNotificationsInput {
    return {
      recipient_type: recipient.recipientType,
      recipient_id:
        recipient.recipientType === 'role' ? undefined : recipient.recipientId,
      recipient_role:
        recipient.recipientType === 'role'
          ? recipient.recipientRole
          : undefined,
    };
  }

  private isAllowedRecipientType(
    recipientType: string | undefined,
  ): recipientType is NotificationRecipientType {
    return (
      recipientType !== undefined &&
      this.allowedRecipientTypes.has(recipientType)
    );
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
    maxLength: number,
  ): void {
    if (value === undefined) {
      return;
    }

    if (!value.trim()) {
      throw new BadRequestException(`${field} cannot be empty`);
    }

    if (value.trim().length > maxLength) {
      throw new BadRequestException(
        `${field} cannot exceed ${maxLength} characters`,
      );
    }
  }

  private normalizeOptionalString(
    value: string | undefined,
  ): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    return value.trim();
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
