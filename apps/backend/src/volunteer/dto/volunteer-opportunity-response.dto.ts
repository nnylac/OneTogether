import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  volunteer_opportunities as VolunteerOpportunityModel,
  volunteer_sources as VolunteerSourceModel,
} from '../../../generated/prisma/client';
import { VolunteerSourceResponseDto } from './volunteer-source-response.dto';

export type VolunteerOpportunityWithSource = VolunteerOpportunityModel & {
  volunteer_sources: VolunteerSourceModel;
};

export class VolunteerOpportunityResponseDto {
  @ApiProperty({ example: '70000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: '60000000-0000-0000-0000-000000000001' })
  sourceId!: string;

  @ApiProperty({ example: 'external-event-123' })
  externalId!: string;

  @ApiProperty({ example: 'Flood Relief Packing Support' })
  title!: string;

  @ApiPropertyOptional({
    example: 'Help pack supplies for affected residents.',
  })
  description!: string | null;

  @ApiPropertyOptional({ example: 'flood_relief' })
  opportunityType!: string | null;

  @ApiPropertyOptional({ example: 'Tampines Community Hub' })
  location!: string | null;

  @ApiPropertyOptional({ example: 'East' })
  region!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  endAt!: Date | null;

  @ApiProperty({ example: 'https://volunteer.example.sg/events/123' })
  signupUrl!: string;

  @ApiPropertyOptional({ example: 'https://volunteer.example.sg/events/123' })
  sourceUrl!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  externalUpdatedAt!: Date | null;

  @ApiProperty({ example: 'open' })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: VolunteerSourceResponseDto })
  source!: VolunteerSourceResponseDto;

  static fromModel(
    opportunity: VolunteerOpportunityWithSource,
  ): VolunteerOpportunityResponseDto {
    return {
      id: opportunity.id,
      sourceId: opportunity.source_id,
      externalId: opportunity.external_id,
      title: opportunity.title,
      description: opportunity.description,
      opportunityType: opportunity.opportunity_type,
      location: opportunity.location,
      region: opportunity.region,
      startAt: opportunity.start_at,
      endAt: opportunity.end_at,
      signupUrl: opportunity.signup_url,
      sourceUrl: opportunity.source_url,
      externalUpdatedAt: opportunity.external_updated_at,
      status: opportunity.opportunity_status,
      createdAt: opportunity.created_at,
      updatedAt: opportunity.updated_at,
      source: VolunteerSourceResponseDto.fromModel(
        opportunity.volunteer_sources,
      ),
    };
  }
}
