import { Module } from '@nestjs/common';
import { IncidentRoomController } from './incident-room.controller';
import { IncidentRoomService } from './incident-room.service';

@Module({
  controllers: [IncidentRoomController],
  providers: [IncidentRoomService],
  exports: [IncidentRoomService],
})
export class IncidentRoomModule {}
