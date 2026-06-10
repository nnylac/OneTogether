import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CommunityEventsService } from './community-events.service';
import { CommunityEventQueryDto } from './dto/community-event-query.dto';
import { CommunityEventResponseDto } from './dto/community-event-response.dto';

@ApiTags('community-events')
@Controller('community-events')
export class CommunityEventsController {
  constructor(private readonly communityEventsService: CommunityEventsService) {}

  @Get()
  @ApiOperation({ summary: 'List open public community events' })
  @ApiOkResponse({ type: CommunityEventResponseDto, isArray: true })
  findAll(
    @Query() query: CommunityEventQueryDto,
  ): Promise<CommunityEventResponseDto[]> {
    return this.communityEventsService.findAll(query);
  }
}
