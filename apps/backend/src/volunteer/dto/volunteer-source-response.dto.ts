import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { volunteer_sources as VolunteerSourceModel } from '../../../generated/prisma/client';

export class VolunteerSourceResponseDto {
  @ApiProperty({ example: '60000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'SG Volunteer Portal' })
  sourceName!: string;

  @ApiProperty({ example: 'https://volunteer.example.sg' })
  sourceUrl!: string;

  @ApiPropertyOptional({ example: '10000000-0000-0000-0000-000000000001' })
  organisationId!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  lastSyncedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  static fromModel(source: VolunteerSourceModel): VolunteerSourceResponseDto {
    return {
      id: source.id,
      sourceName: source.source_name,
      sourceUrl: source.source_url,
      organisationId: source.organisation_id,
      isActive: source.is_active,
      lastSyncedAt: source.last_synced_at,
      createdAt: source.created_at,
      updatedAt: source.updated_at,
    };
  }
}
