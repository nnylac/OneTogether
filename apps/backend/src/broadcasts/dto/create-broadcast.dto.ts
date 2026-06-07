import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BroadcastAudienceDto } from './broadcast-audience.dto';

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Flash flood warning', maxLength: 120 })
  title!: string;

  @ApiProperty({
    example: 'Avoid low-lying areas near Bishan until further notice.',
  })
  message!: string;

  @ApiProperty({ example: 'weather_warning', maxLength: 50 })
  broadcastType!: string;

  @ApiPropertyOptional({
    example: 'warning',
    enum: ['info', 'advisory', 'warning', 'critical'],
  })
  severity?: string;

  @ApiPropertyOptional({
    example: '50000000-0000-0000-0000-000000000001',
  })
  createdByUserId?: string;

  @ApiProperty({ type: BroadcastAudienceDto, isArray: true })
  audiences!: BroadcastAudienceDto[];
}
