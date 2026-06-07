import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateVolunteerSourceDto } from './dto/create-volunteer-source.dto';
import { UpdateVolunteerSourceDto } from './dto/update-volunteer-source.dto';
import { UpsertVolunteerOpportunityDto } from './dto/upsert-volunteer-opportunity.dto';
import { VolunteerOpportunityQueryDto } from './dto/volunteer-opportunity-query.dto';
import { VolunteerOpportunityResponseDto } from './dto/volunteer-opportunity-response.dto';
import { VolunteerSourceResponseDto } from './dto/volunteer-source-response.dto';
import { VolunteerService } from './volunteer.service';

@ApiTags('volunteer')
@Controller('volunteer')
export class VolunteerController {
  constructor(private readonly volunteerService: VolunteerService) {}

  @Get('opportunities')
  @ApiOperation({ summary: 'List synced volunteer opportunities' })
  @ApiOkResponse({ type: VolunteerOpportunityResponseDto, isArray: true })
  findOpportunities(
    @Query() query: VolunteerOpportunityQueryDto,
  ): Promise<VolunteerOpportunityResponseDto[]> {
    return this.volunteerService.findOpportunities(query);
  }

  @Get('opportunities/:id')
  @ApiOperation({ summary: 'Get one synced volunteer opportunity by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: VolunteerOpportunityResponseDto })
  findOpportunity(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<VolunteerOpportunityResponseDto> {
    return this.volunteerService.findOpportunity(id);
  }

  @Post('opportunities/upsert')
  @ApiOperation({
    summary: 'Create or update one externally synced opportunity',
  })
  @ApiCreatedResponse({ type: VolunteerOpportunityResponseDto })
  upsertOpportunity(
    @Body() dto: UpsertVolunteerOpportunityDto,
  ): Promise<VolunteerOpportunityResponseDto> {
    return this.volunteerService.upsertOpportunity(dto);
  }

  @Get('sources')
  @ApiOperation({ summary: 'List verified volunteer sources' })
  @ApiOkResponse({ type: VolunteerSourceResponseDto, isArray: true })
  findSources(): Promise<VolunteerSourceResponseDto[]> {
    return this.volunteerService.findSources();
  }

  @Post('sources')
  @ApiOperation({ summary: 'Create one verified volunteer source' })
  @ApiCreatedResponse({ type: VolunteerSourceResponseDto })
  createSource(
    @Body() dto: CreateVolunteerSourceDto,
  ): Promise<VolunteerSourceResponseDto> {
    return this.volunteerService.createSource(dto);
  }

  @Patch('sources/:id')
  @ApiOperation({ summary: 'Update one verified volunteer source' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: VolunteerSourceResponseDto })
  updateSource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVolunteerSourceDto,
  ): Promise<VolunteerSourceResponseDto> {
    return this.volunteerService.updateSource(id, dto);
  }
}
