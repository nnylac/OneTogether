import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOrganisationDto {
  @ApiPropertyOptional({ example: 'SCDF Central Division', maxLength: 50 })
  orgName?: string;
}
