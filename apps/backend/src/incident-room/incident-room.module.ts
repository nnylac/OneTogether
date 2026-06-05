import { Module } from '@nestjs/common';
import { IncidentRoomController } from './incident-room.controller';
import { IncidentRoomService } from './incident-room.service';
import { IncidentRoomGateway } from './incident-room.gateway';

@Module({
  controllers: [IncidentRoomController],
  providers: [IncidentRoomService, IncidentRoomGateway],
})
export class IncidentRoomModule {}
