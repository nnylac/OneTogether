import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  notification_recipients as NotificationRecipientModel,
  notifications as NotificationModel,
} from '../../../generated/prisma/client';

export type NotificationWithRecipients = NotificationModel & {
  notification_recipients: NotificationRecipientModel[];
};

export class NotificationRecipientResponseDto {
  @ApiProperty({ example: '30000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({
    example: 'organisation',
    enum: ['user', 'organisation', 'role'],
  })
  recipientType!: string;

  @ApiPropertyOptional({ example: '10000000-0000-0000-0000-000000000001' })
  recipientId!: string | null;

  @ApiPropertyOptional({ example: 'government' })
  recipientRole!: string | null;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  readAt!: Date | null;

  static fromModel(
    recipient: NotificationRecipientModel,
  ): NotificationRecipientResponseDto {
    return {
      id: recipient.id,
      recipientType: recipient.recipient_type,
      recipientId: recipient.recipient_id,
      recipientRole: recipient.recipient_role,
      isRead: recipient.is_read,
      readAt: recipient.read_at,
    };
  }
}

export class NotificationResponseDto {
  @ApiProperty({ example: '30000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'Incident assigned' })
  title!: string;

  @ApiProperty({
    example: 'A kitchen fire incident has been assigned to your organisation.',
  })
  message!: string;

  @ApiProperty({ example: 'incident_assigned' })
  notificationType!: string;

  @ApiPropertyOptional({ example: 'incident' })
  referenceType!: string | null;

  @ApiPropertyOptional({ example: '20000000-0000-0000-0000-000000000001' })
  referenceId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: NotificationRecipientResponseDto, isArray: true })
  recipients!: NotificationRecipientResponseDto[];

  static fromModel(
    notification: NotificationWithRecipients,
  ): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      notificationType: notification.notification_type,
      referenceType: notification.reference_type,
      referenceId: notification.reference_id,
      createdAt: notification.created_at,
      recipients: notification.notification_recipients.map((recipient) =>
        NotificationRecipientResponseDto.fromModel(recipient),
      ),
    };
  }
}
