import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CommunityEventQueryDto } from './dto/community-event-query.dto';
import { CommunityEventResponseDto } from './dto/community-event-response.dto';

@Injectable()
export class CommunityEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: CommunityEventQueryDto = {},
  ): Promise<CommunityEventResponseDto[]> {
    const events = await this.prisma.community_events.findMany({
      where: this.toWhere(query),
      orderBy: [{ start_at: 'asc' }, { created_at: 'desc' }],
    });

    return events.map((event) => CommunityEventResponseDto.fromModel(event));
  }

  private toWhere(
    query: CommunityEventQueryDto,
  ): Prisma.community_eventsWhereInput {
    const where: Prisma.community_eventsWhereInput = {
      event_status: query.status ?? 'open',
    };

    if (query.category) {
      where.category = query.category;
    }

    if (query.region) {
      where.region = { contains: query.region, mode: 'insensitive' };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { organiser_name: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }
}
