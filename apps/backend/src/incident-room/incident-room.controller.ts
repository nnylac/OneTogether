import { Controller, Get, Param } from '@nestjs/common';
import { IncidentRoomService } from './incident-room.service';

@Controller('incident-room')
export class IncidentRoomController {
  constructor(private readonly incidentRoomService: IncidentRoomService) {}

  @Get('incidents/:incidentId/messages')
  findMessages(@Param('incidentId') incidentId: string) {
    return this.incidentRoomService.findMessages(incidentId);
  }
}
