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
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { OrganisationQueryDto } from './dto/organisation-query.dto';
import { OrganisationResponseDto } from './dto/organisation-response.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationsService } from './organisations.service';

@ApiTags('organisations')
@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  @Get()
  @ApiOperation({ summary: 'List organisations' })
  @ApiOkResponse({ type: OrganisationResponseDto, isArray: true })
  findAll(
    @Query() query: OrganisationQueryDto,
  ): Promise<OrganisationResponseDto[]> {
    return this.organisationsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one organisation by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OrganisationResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create one organisation' })
  @ApiCreatedResponse({ type: OrganisationResponseDto })
  create(@Body() dto: CreateOrganisationDto): Promise<OrganisationResponseDto> {
    return this.organisationsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update one organisation' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: OrganisationResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrganisationDto,
  ): Promise<OrganisationResponseDto> {
    return this.organisationsService.update(id, dto);
  }
}
