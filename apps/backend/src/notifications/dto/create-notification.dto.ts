import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationRecipientDto } from './notification-recipient.dto';

export class CreateNotificationDto {
  @ApiProperty({ example: 'Incident assigned', maxLength: 120 })
  title!: string;

  @ApiProperty({
    example: 'A kitchen fire incident has been assigned to your organisation.',
  })
  message!: string;

  @ApiProperty({ example: 'incident_assigned', maxLength: 50 })
  notificationType!: string;

  @ApiPropertyOptional({ example: 'incident', maxLength: 50 })
  referenceType?: string;

  @ApiPropertyOptional({
    example: '20000000-0000-0000-0000-000000000001',
  })
  referenceId?: string;

  @ApiProperty({ type: NotificationRecipientDto, isArray: true })
  recipients!: NotificationRecipientDto[];
}
