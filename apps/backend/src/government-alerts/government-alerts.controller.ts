import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateGovernmentAlertRuleDto } from './dto/create-government-alert-rule.dto';
import {
  GovernmentAlertMetricDefinitionDto,
  GovernmentAlertRuleResponseDto,
} from './dto/government-alert-rule-response.dto';
import { UpdateGovernmentAlertRuleDto } from './dto/update-government-alert-rule.dto';
import { GovernmentAlertsService } from './government-alerts.service';

@ApiTags('government-alerts')
@Controller('government-alert-rules')
export class GovernmentAlertsController {
  constructor(
    private readonly governmentAlertsService: GovernmentAlertsService,
  ) {}

  @Get('metric-definitions')
  @ApiOperation({ summary: 'List government alert metric presets' })
  @ApiOkResponse({ type: GovernmentAlertMetricDefinitionDto, isArray: true })
  findMetricDefinitions(): Promise<GovernmentAlertMetricDefinitionDto[]> {
    return this.governmentAlertsService.findMetricDefinitions();
  }

  @Get()
  @ApiOperation({ summary: 'List government alert rules with live status' })
  @ApiOkResponse({ type: GovernmentAlertRuleResponseDto, isArray: true })
  findAll(
    @Query('status') status?: string,
  ): Promise<GovernmentAlertRuleResponseDto[]> {
    return this.governmentAlertsService.findAll({ status });
  }

  @Post()
  @ApiOperation({ summary: 'Create a government alert rule' })
  @ApiOkResponse({ type: GovernmentAlertRuleResponseDto })
  create(
    @Body() dto: CreateGovernmentAlertRuleDto,
  ): Promise<GovernmentAlertRuleResponseDto> {
    return this.governmentAlertsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a government alert rule' })
  @ApiOkResponse({ type: GovernmentAlertRuleResponseDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGovernmentAlertRuleDto,
  ): Promise<GovernmentAlertRuleResponseDto> {
    return this.governmentAlertsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a government alert rule' })
  @ApiOkResponse({ schema: { example: { id: 'uuid', deleted: true } } })
  delete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ id: string; deleted: true }> {
    return this.governmentAlertsService.delete(id);
  }
}

