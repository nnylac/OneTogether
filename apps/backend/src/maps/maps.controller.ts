import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { IncidentMapDto } from './dto/incident-map.dto';
import { MapsService } from './maps.service';

@ApiTags('maps')
@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('incidents/:incidentId')
  @ApiOperation({
    summary: 'Operational map snapshot for one incident (location + resources)',
  })
  @ApiParam({ name: 'incidentId', format: 'uuid' })
  @ApiOkResponse({
    schema: {
      example: {
        incident: {
          id: '00000000-0000-0000-0000-000000000001',
          code: 'EXT1A2B3C',
          title: 'SCDF - FIRE - Toa Payoh Hub',
          incidentType: 'FIRE',
          severity: 4,
          status: 'active',
          location: 'Toa Payoh Hub, Toa Payoh',
          lat: 1.3329,
          lng: 103.848,
        },
        resources: [],
        summary: {
          total: 0,
          dispatched: 0,
          enRoute: 0,
          onScene: 0,
          returning: 0,
          unavailable: 0,
          completed: 0,
        },
      },
    },
  })
  getIncidentMap(
    @Param('incidentId', ParseUUIDPipe) incidentId: string,
  ): Promise<IncidentMapDto> {
    return this.mapsService.getIncidentMap(incidentId);
  }
}
