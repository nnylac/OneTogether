import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export type BroadcastAudienceType =
  | 'public'
  | 'role'
  | 'organisation'
  | 'region';

export class BroadcastAudienceDto {
  @ApiProperty({
    example: 'role',
    enum: ['public', 'role', 'organisation', 'region'],
  })
  audienceType!: BroadcastAudienceType;

  @ApiPropertyOptional({
    example: 'user',
    description: 'Required for role audiences.',
  })
  audienceRole?: string;

  @ApiPropertyOptional({
    example: '10000000-0000-0000-0000-000000000001',
    description: 'Required for organisation audiences.',
  })
  organisationId?: string;

  @ApiPropertyOptional({
    example: 'North',
    description: 'Required for region audiences.',
  })
  region?: string;
}
