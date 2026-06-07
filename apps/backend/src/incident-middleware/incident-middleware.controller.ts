import { Body, Controller, Post } from '@nestjs/common';
import { IncidentMiddlewareService } from './incident-middleware.service';
import type { RawAgencyMessage } from './incident-middleware.types';

@Controller('incident-middleware')
export class IncidentMiddlewareController {
  constructor(private readonly service: IncidentMiddlewareService) {}

  @Post('events')
  ingestAgencyMessage(@Body() message: RawAgencyMessage) {
    return this.service.ingest(message);
  }
}
