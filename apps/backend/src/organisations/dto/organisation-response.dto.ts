import { ApiProperty } from '@nestjs/swagger';
import type { organisations as OrganisationModel } from '../../../generated/prisma/client';

export class OrganisationResponseDto {
  @ApiProperty({ example: '10000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'SCDF Central Division' })
  orgName!: string;

  static fromModel(organisation: OrganisationModel): OrganisationResponseDto {
    return {
      id: organisation.id,
      orgName: organisation.org_name,
    };
  }
}
