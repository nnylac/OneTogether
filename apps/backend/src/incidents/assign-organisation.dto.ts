import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AssignedOrganisationStatus } from './assigned-organisation-status';
import { assignedOrganisationStatuses } from './assigned-organisation-status';

export class AssignOrganisationDto {
  @ApiProperty({ example: '10000000-0000-0000-0000-000000000001' })
  organisationId!: string;

  @ApiPropertyOptional({ example: 'SCDF Alpha 12' })
  unitName?: string;

  @ApiPropertyOptional({
    enum: assignedOrganisationStatuses,
    example: 'DISPATCHED',
  })
  status?: AssignedOrganisationStatus;

  @ApiPropertyOptional({ example: 'Crew assigned for first response.' })
  notes?: string;
}
