import { ApiPropertyOptional } from '@nestjs/swagger';
import type { BroadcastAudienceType } from './broadcast-audience.dto';

export class BroadcastQueryDto {
  @ApiPropertyOptional({
    example: 'published',
    enum: ['draft', 'published', 'archived', 'cancelled'],
  })
  status?: string;

  @ApiPropertyOptional({
    example: 'warning',
    enum: ['info', 'advisory', 'warning', 'critical'],
  })
  severity?: string;

  @ApiPropertyOptional({ example: 'weather_warning' })
  broadcastType?: string;

  @ApiPropertyOptional({
    example: 'role',
    enum: ['public', 'role', 'organisation', 'region'],
  })
  audienceType?: BroadcastAudienceType;

  @ApiPropertyOptional({ example: 'user' })
  audienceRole?: string;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000001',
  })
  organisationId?: string;

  @ApiPropertyOptional({ example: 'North' })
  region?: string;

  @ApiPropertyOptional({ example: 10 })
  take?: number | string;

  @ApiPropertyOptional({ example: 0 })
  skip?: number | string;
}
