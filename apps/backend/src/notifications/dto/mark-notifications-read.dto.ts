import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { NotificationRecipientType } from './notification-recipient.dto';

export class MarkNotificationsReadDto {
  @ApiProperty({
    example: 'organisation',
    enum: ['user', 'organisation', 'role'],
  })
  recipientType!: NotificationRecipientType;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000001',
    description: 'Required for user and organisation recipients.',
  })
  recipientId?: string;

  @ApiPropertyOptional({
    example: 'government',
    description: 'Required for role recipients.',
  })
  recipientRole?: string;

  @ApiPropertyOptional({ example: 'government_alert_triggered' })
  notificationType?: string;
}
