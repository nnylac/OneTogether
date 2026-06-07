import { ApiProperty } from '@nestjs/swagger';

export class AssignOrganisationDto {
  @ApiProperty({ example: '10000000-0000-0000-0000-000000000001' })
  organisationId!: string;
}
