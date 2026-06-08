import { ApiPropertyOptional } from '@nestjs/swagger';
import type { AssignedOrganisationStatus } from './assigned-organisation-status';
import { assignedOrganisationStatuses } from './assigned-organisation-status';

export class UpdateAssignedOrganisationDto {
  @ApiPropertyOptional({ example: 'SCDF Alpha 12' })
  unitName?: string;

  @ApiPropertyOptional({
    enum: assignedOrganisationStatuses,
    example: 'ON SCENE',
  })
  status?: AssignedOrganisationStatus;

  @ApiPropertyOptional({ example: 'Unit awaiting traffic police handover.' })
  notes?: string;
}
