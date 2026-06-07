import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { NotificationWithRecipients } from './dto/notification-response.dto';

export type FindNotificationsFilters = {
  recipientType?: string;
  recipientId?: string;
  recipientRole?: string;
  isRead?: boolean;
  notificationType?: string;
  take?: number;
  skip?: number;
};

export type NotificationRecipientInput = {
  recipient_type: string;
  recipient_id?: string;
  recipient_role?: string;
};

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    filters: FindNotificationsFilters = {},
  ): Promise<NotificationWithRecipients[]> {
    return this.prisma.notifications.findMany({
      where: this.buildWhere(filters),
      include: {
        notification_recipients: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: filters.take,
      skip: filters.skip,
    });
  }

  findById(id: string): Promise<NotificationWithRecipients | null> {
    return this.prisma.notifications.findUnique({
      where: { id },
      include: {
        notification_recipients: true,
      },
    });
  }

  create(
    data: Prisma.notificationsCreateInput,
  ): Promise<NotificationWithRecipients> {
    return this.prisma.notifications.create({
      data,
      include: {
        notification_recipients: true,
      },
    });
  }

  findRecipientById(id: string) {
    return this.prisma.notification_recipients.findUnique({
      where: { id },
    });
  }

  markRecipientAsRead(id: string) {
    return this.prisma.notification_recipients.update({
      where: { id },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  markAllAsRead(
    filters: FindNotificationsFilters,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.notification_recipients.updateMany({
      where: this.buildRecipientWhere(filters),
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });
  }

  private buildWhere(
    filters: FindNotificationsFilters,
  ): Prisma.notificationsWhereInput {
    const where: Prisma.notificationsWhereInput = {};

    if (filters.notificationType) {
      where.notification_type = filters.notificationType;
    }

    const recipientWhere = this.buildRecipientWhere(filters);

    if (Object.keys(recipientWhere).length > 0) {
      where.notification_recipients = {
        some: recipientWhere,
      };
    }

    return where;
  }

  private buildRecipientWhere(
    filters: FindNotificationsFilters,
  ): Prisma.notification_recipientsWhereInput {
    const where: Prisma.notification_recipientsWhereInput = {};

    if (filters.recipientType) {
      where.recipient_type = filters.recipientType;
    }

    if (filters.recipientId) {
      where.recipient_id = filters.recipientId;
    }

    if (filters.recipientRole) {
      where.recipient_role = filters.recipientRole;
    }

    if (filters.isRead !== undefined) {
      where.is_read = filters.isRead;
    }

    return where;
  }
}
