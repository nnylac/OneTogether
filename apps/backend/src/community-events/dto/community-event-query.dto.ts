import { ApiPropertyOptional } from '@nestjs/swagger';

export class CommunityEventQueryDto {
  @ApiPropertyOptional({ example: 'preparedness' })
  category?: string;

  @ApiPropertyOptional({ example: 'West' })
  region?: string;

  @ApiPropertyOptional({ example: 'open' })
  status?: string;

  @ApiPropertyOptional({ example: 'first aid' })
  search?: string;
}
