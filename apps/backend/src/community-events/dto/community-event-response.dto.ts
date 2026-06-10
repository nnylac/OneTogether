import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { community_events as CommunityEventModel } from '../../../generated/prisma/client';

export class CommunityEventResponseDto {
  @ApiProperty({ example: '51000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'Community Emergency Preparedness Workshop' })
  title!: string;

  @ApiProperty({ example: 'Jurong West RC' })
  organiserName!: string;

  @ApiProperty({ example: 'preparedness' })
  category!: string;

  @ApiPropertyOptional({ example: 'Learn basic first aid.' })
  description!: string | null;

  @ApiPropertyOptional({ example: 'Jurong West CC' })
  location!: string | null;

  @ApiPropertyOptional({ example: 'West' })
  region!: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  endAt!: Date | null;

  @ApiProperty({ example: 60, nullable: true })
  capacity!: number | null;

  @ApiProperty({ example: 38 })
  registeredCount!: number;

  @ApiProperty({ example: 22, nullable: true })
  spotsLeft!: number | null;

  @ApiProperty({ example: 0.63, nullable: true })
  registrationProgress!: number | null;

  @ApiProperty({ example: true })
  isFree!: boolean;

  @ApiPropertyOptional({ example: 'https://onetogether.sg/community/workshop' })
  signupUrl!: string | null;

  @ApiProperty({ example: 'open' })
  status!: string;

  static fromModel(event: CommunityEventModel): CommunityEventResponseDto {
    return {
      id: event.id,
      title: event.title,
      organiserName: event.organiser_name,
      category: event.category,
      description: event.description,
      location: event.location,
      region: event.region,
      startAt: event.start_at,
      endAt: event.end_at,
      capacity: event.capacity,
      registeredCount: event.registered_count,
      spotsLeft:
        event.capacity === null
          ? null
          : Math.max(event.capacity - event.registered_count, 0),
      registrationProgress:
        event.capacity === null || event.capacity === 0
          ? null
          : event.registered_count / event.capacity,
      isFree: event.is_free,
      signupUrl: event.signup_url,
      status: event.event_status,
    };
  }
}
