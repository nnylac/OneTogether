import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  broadcast_audiences as BroadcastAudienceModel,
  broadcasts as BroadcastModel,
} from '../../../generated/prisma/client';

export type BroadcastWithAudiences = BroadcastModel & {
  broadcast_audiences: BroadcastAudienceModel[];
};

export class BroadcastAudienceResponseDto {
  @ApiProperty({ example: '40000000-0000-0000-0000-000000000002' })
  id!: string;

  @ApiProperty({
    example: 'role',
    enum: ['public', 'role', 'organisation', 'region'],
  })
  audienceType!: string;

  @ApiPropertyOptional({ example: 'user' })
  audienceRole!: string | null;

  @ApiPropertyOptional({ example: '10000000-0000-0000-0000-000000000001' })
  organisationId!: string | null;

  @ApiPropertyOptional({ example: 'North' })
  region!: string | null;

  static fromModel(
    audience: BroadcastAudienceModel,
  ): BroadcastAudienceResponseDto {
    return {
      id: audience.id,
      audienceType: audience.audience_type,
      audienceRole: audience.audience_role,
      organisationId: audience.organisation_id,
      region: audience.region,
    };
  }
}

export class BroadcastResponseDto {
  @ApiProperty({ example: '40000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'Flash flood warning' })
  title!: string;

  @ApiProperty({
    example: 'Avoid low-lying areas near Bishan until further notice.',
  })
  message!: string;

  @ApiProperty({ example: 'weather_warning' })
  broadcastType!: string;

  @ApiProperty({ example: 'warning' })
  severity!: string;

  @ApiProperty({ example: 'draft' })
  status!: string;

  @ApiPropertyOptional({ example: '50000000-0000-0000-0000-000000000001' })
  createdByUserId!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  archivedAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;

  @ApiProperty({ type: BroadcastAudienceResponseDto, isArray: true })
  audiences!: BroadcastAudienceResponseDto[];

  static fromModel(broadcast: BroadcastWithAudiences): BroadcastResponseDto {
    return {
      id: broadcast.id,
      title: broadcast.title,
      message: broadcast.message,
      broadcastType: broadcast.broadcast_type,
      severity: broadcast.severity,
      status: broadcast.broadcast_status,
      createdByUserId: broadcast.created_by_user_id,
      publishedAt: broadcast.published_at,
      archivedAt: broadcast.archived_at,
      createdAt: broadcast.created_at,
      updatedAt: broadcast.updated_at,
      audiences: broadcast.broadcast_audiences.map((audience) =>
        BroadcastAudienceResponseDto.fromModel(audience),
      ),
    };
  }
}
