import { ApiPropertyOptional } from '@nestjs/swagger';
import type { NotificationRecipientType } from './notification-recipient.dto';

export class NotificationQueryDto {
  @ApiPropertyOptional({
    example: 'organisation',
    enum: ['user', 'organisation', 'role'],
  })
  recipientType?: NotificationRecipientType;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000001',
  })
  recipientId?: string;

  @ApiPropertyOptional({ example: 'government' })
  recipientRole?: string;

  @ApiPropertyOptional({ example: false })
  isRead?: boolean | string;

  @ApiPropertyOptional({ example: 'incident_assigned' })
  notificationType?: string;

  @ApiPropertyOptional({ example: 10 })
  take?: number | string;

  @ApiPropertyOptional({ example: 0 })
  skip?: number | string;
}
