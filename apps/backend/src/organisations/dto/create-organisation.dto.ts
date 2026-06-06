import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganisationDto {
  @ApiProperty({ example: 'SCDF Central Division', maxLength: 50 })
  orgName!: string;
}
