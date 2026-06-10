import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertVolunteerOpportunityDto {
  @ApiProperty({ example: '60000000-0000-0000-0000-000000000001' })
  sourceId!: string;

  @ApiProperty({ example: 'external-event-123' })
  externalId!: string;

  @ApiProperty({ example: 'Flood Relief Packing Support', maxLength: 150 })
  title!: string;

  @ApiPropertyOptional({
    example: 'Help pack supplies for affected residents.',
  })
  description?: string;

  @ApiPropertyOptional({ example: 'flood_relief', maxLength: 50 })
  opportunityType?: string;

  @ApiPropertyOptional({
    example: 'urgent',
    enum: ['normal', 'urgent', 'critical'],
  })
  urgency?: string;

  @ApiPropertyOptional({ example: 'Tampines Community Hub' })
  location?: string;

  @ApiPropertyOptional({ example: 'East', maxLength: 100 })
  region?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  startAt?: Date | string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endAt?: Date | string;

  @ApiPropertyOptional({ example: 30 })
  slotsTotal?: number | string | null;

  @ApiPropertyOptional({ example: 18 })
  slotsFilled?: number | string;

  @ApiPropertyOptional({ example: false })
  requiresTraining?: boolean | string;

  @ApiProperty({ example: 'https://volunteer.example.sg/events/123' })
  signupUrl!: string;

  @ApiPropertyOptional({ example: 'https://volunteer.example.sg/events/123' })
  sourceUrl?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  externalUpdatedAt?: Date | string;

  @ApiPropertyOptional({ example: 'open' })
  status?: string;
}
