import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVolunteerSourceDto {
  @ApiProperty({ example: 'SG Volunteer Portal', maxLength: 100 })
  sourceName!: string;

  @ApiProperty({ example: 'https://volunteer.example.sg' })
  sourceUrl!: string;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000001',
  })
  organisationId?: string;

  @ApiPropertyOptional({ example: true })
  isActive?: boolean;
}
