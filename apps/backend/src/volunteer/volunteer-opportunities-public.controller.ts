import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VolunteerOpportunityQueryDto } from './dto/volunteer-opportunity-query.dto';
import { VolunteerOpportunityResponseDto } from './dto/volunteer-opportunity-response.dto';
import { VolunteerService } from './volunteer.service';

@ApiTags('volunteer-opportunities')
@Controller('volunteer-opportunities')
export class VolunteerOpportunitiesPublicController {
  constructor(private readonly volunteerService: VolunteerService) {}

  @Get()
  @ApiOperation({ summary: 'List open public volunteer opportunities' })
  @ApiOkResponse({ type: VolunteerOpportunityResponseDto, isArray: true })
  findOpenOpportunities(
    @Query() query: VolunteerOpportunityQueryDto,
  ): Promise<VolunteerOpportunityResponseDto[]> {
    return this.volunteerService.findOpportunities({
      ...query,
      status: query.status ?? 'open',
    });
  }
}
