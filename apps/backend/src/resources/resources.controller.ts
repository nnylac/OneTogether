import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ResourcesService } from './resources.service';

type ResourceQuery = {
  agencyId?: string;
  outletType?: string;
  region?: string;
  resourceCategory?: string;
};

@ApiTags('resources')
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post('sync')
  @ApiOperation({ summary: 'Synchronize resource snapshots from agencies' })
  syncResources() {
    return this.resourcesService.syncResources();
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get resource availability summary' })
  @ApiOkResponse({
    schema: {
      example: {
        lastSyncedAt: '2026-06-08T10:00:00.000Z',
        totals: {
          total: 1000,
          available: 700,
          deployed: 220,
          reserved: 30,
          maintenance: 50,
        },
        byAgency: [],
        byCategory: [],
        criticalOutlets: [],
      },
    },
  })
  findSummary(@Query() query: ResourceQuery) {
    return this.resourcesService.findSummary(this.toFilters(query));
  }

  @Get('outlets')
  @ApiOperation({ summary: 'List synchronized resource outlets' })
  findOutlets(@Query() query: ResourceQuery) {
    return this.resourcesService.findOutlets(this.toFilters(query));
  }

  @Get('outlets/:id')
  @ApiOperation({ summary: 'Get one synchronized resource outlet' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findOutlet(@Param('id') id: string) {
    return this.resourcesService.findOutlet(id);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'List synchronized resource inventory rows' })
  findInventory(@Query() query: ResourceQuery) {
    return this.resourcesService.findInventory(this.toFilters(query));
  }

  private toFilters(query: ResourceQuery) {
    return {
      agencyId: this.normalizeOptionalString(query.agencyId),
      outletType: this.normalizeOptionalString(query.outletType),
      region: this.normalizeOptionalString(query.region),
      resourceCategory: this.normalizeOptionalString(query.resourceCategory),
    };
  }

  private normalizeOptionalString(value: string | undefined) {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  }
}
