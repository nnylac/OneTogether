import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

export type AnalyticsOverviewQuery = {
  from?: string;
  to?: string;
  incidentType?: string;
  severity?: string;
  status?: string;
  organisationId?: string;
  region?: string;
};

export type AnalyticsForecastQuery = AnalyticsOverviewQuery & {
  days?: string;
};

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get multi-agency government incident analytics overview',
  })
  findOverview(@Query() query: AnalyticsOverviewQuery) {
    return this.analyticsService.findOverview(query);
  }

  @Get('forecast')
  @ApiOperation({
    summary: 'Forecast future simulated incident volume and distribution',
  })
  findForecast(@Query() query: AnalyticsForecastQuery) {
    return this.analyticsService.findForecast(query);
  }
}
