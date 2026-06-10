import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { organisations as OrganisationModel } from '../../../generated/prisma/client';

export class OrganisationResponseDto {
  @ApiProperty({ example: '10000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'SCDF Central Division' })
  orgName!: string;

  @ApiPropertyOptional({ example: '995' })
  contactNumber!: string | null;

  @ApiPropertyOptional({ example: 'Emergency hotline' })
  contactChannel!: string | null;

  @ApiPropertyOptional({
    example:
      'Fire, rescue, ambulance, hazardous material, and emergency medical response.',
  })
  serviceSummary!: string | null;

  @ApiPropertyOptional({
    example:
      'Call 995 for life-threatening medical emergencies, fire, rescue, or hazardous material incidents.',
  })
  contactGuidance!: string | null;

  static fromModel(organisation: OrganisationModel): OrganisationResponseDto {
    return {
      id: organisation.id,
      orgName: organisation.org_name,
      contactNumber: organisation.contact_number,
      contactChannel: organisation.contact_channel,
      serviceSummary: organisation.service_summary,
      contactGuidance: organisation.contact_guidance,
    };
  }
}
