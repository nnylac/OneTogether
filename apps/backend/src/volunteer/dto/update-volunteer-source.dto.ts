import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateVolunteerSourceDto {
  @ApiPropertyOptional({ example: 'SG Volunteer Portal', maxLength: 100 })
  sourceName?: string;

  @ApiPropertyOptional({ example: 'https://volunteer.example.sg' })
  sourceUrl?: string;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000001',
  })
  organisationId?: string | null;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean | string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastSyncedAt?: Date | string | null;
}
