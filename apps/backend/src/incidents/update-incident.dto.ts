import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ example: 'Cardiac arrest at Orchard MRT' })
  title?: string;

  @ApiPropertyOptional({ example: 'Medical' })
  incidentType?: string;

  @ApiPropertyOptional({ example: 4 })
  severity?: number;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'closed', 'resolved'] })
  status?: 'active' | 'closed' | 'resolved';

  @ApiPropertyOptional({ example: 'Patient found unconscious near platform B.' })
  description?: string;

  @ApiPropertyOptional({ example: 'Orchard MRT Exit B' })
  location?: string;

  @ApiPropertyOptional({
    example: '{"responsePlan":"SCDF dispatched ambulance.","otherNotes":"Monitor handover."}',
  })
  report?: string;

  @ApiPropertyOptional({ example: '2026-06-07T12:37:00.000Z' })
  createdAt?: string;

  @ApiPropertyOptional({ example: '2026-06-07T13:20:00.000Z' })
  resolvedAt?: string | null;

  @ApiPropertyOptional({ example: 95 })
  confidenceScore?: number;
}