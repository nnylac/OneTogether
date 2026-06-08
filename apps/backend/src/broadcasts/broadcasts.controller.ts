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
import { BroadcastQueryDto } from './dto/broadcast-query.dto';
import { BroadcastResponseDto } from './dto/broadcast-response.dto';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { UpdateBroadcastDto } from './dto/update-broadcast.dto';
import { BroadcastsService } from './broadcasts.service';

@ApiTags('broadcasts')
@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Get()
  @ApiOperation({ summary: 'List broadcasts' })
  @ApiOkResponse({ type: BroadcastResponseDto, isArray: true })
  findAll(@Query() query: BroadcastQueryDto): Promise<BroadcastResponseDto[]> {
    return this.broadcastsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one broadcast by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BroadcastResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BroadcastResponseDto> {
    return this.broadcastsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create one draft broadcast' })
  @ApiCreatedResponse({ type: BroadcastResponseDto })
  create(@Body() dto: CreateBroadcastDto): Promise<BroadcastResponseDto> {
    return this.broadcastsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update one draft broadcast' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BroadcastResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBroadcastDto,
  ): Promise<BroadcastResponseDto> {
    return this.broadcastsService.update(id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish one draft broadcast' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BroadcastResponseDto })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BroadcastResponseDto> {
    return this.broadcastsService.publish(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive one published broadcast' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BroadcastResponseDto })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BroadcastResponseDto> {
    return this.broadcastsService.archive(id);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel one draft broadcast' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiOkResponse({ type: BroadcastResponseDto })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BroadcastResponseDto> {
    return this.broadcastsService.cancel(id);
  }
}
