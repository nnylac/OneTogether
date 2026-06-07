import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type NotificationRecipientType = 'user' | 'organisation' | 'role';

export class NotificationRecipientDto {
  @ApiProperty({ example: 'user', enum: ['user', 'organisation', 'role'] })
  recipientType!: NotificationRecipientType;

  @ApiPropertyOptional({
    example: '50000000-0000-0000-0000-000000000001',
    description: 'Required for user and organisation recipients.',
  })
  recipientId?: string;

  @ApiPropertyOptional({
    example: 'government',
    description: 'Required for role recipients.',
  })
  recipientRole?: string;
}
