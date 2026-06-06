import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrganisationQueryDto {
  @ApiPropertyOptional({ example: 'SCDF' })
  search?: string;

  @ApiPropertyOptional({ example: 10 })
  take?: number | string;

  @ApiPropertyOptional({ example: 0 })
  skip?: number | string;
}
