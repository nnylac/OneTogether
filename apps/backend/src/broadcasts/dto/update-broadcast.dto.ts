import { ApiPropertyOptional } from '@nestjs/swagger';
import { BroadcastAudienceDto } from './broadcast-audience.dto';

export class UpdateBroadcastDto {
  @ApiPropertyOptional({ example: 'Flash flood warning', maxLength: 120 })
  title?: string;

  @ApiPropertyOptional({
    example: 'Avoid low-lying areas near Bishan until further notice.',
  })
  message?: string;

  @ApiPropertyOptional({ example: 'weather_warning', maxLength: 50 })
  broadcastType?: string;

  @ApiPropertyOptional({
    example: 'warning',
    enum: ['info', 'advisory', 'warning', 'critical'],
  })
  severity?: string;

  @ApiPropertyOptional({ type: BroadcastAudienceDto, isArray: true })
  audiences?: BroadcastAudienceDto[];
}
