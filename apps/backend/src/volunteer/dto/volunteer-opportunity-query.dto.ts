import { ApiPropertyOptional } from '@nestjs/swagger';

export class VolunteerOpportunityQueryDto {
  @ApiPropertyOptional({ example: '60000000-0000-0000-0000-000000000001' })
  sourceId?: string;

  @ApiPropertyOptional({ example: 'East' })
  region?: string;

  @ApiPropertyOptional({ example: 'flood_relief' })
  opportunityType?: string;

  @ApiPropertyOptional({ example: 'urgent' })
  urgency?: string;

  @ApiPropertyOptional({ example: 'open' })
  status?: string;

  @ApiPropertyOptional({ example: 'cleanup' })
  search?: string;

  @ApiPropertyOptional({ example: 10 })
  take?: number | string;

  @ApiPropertyOptional({ example: 0 })
  skip?: number | string;
}
