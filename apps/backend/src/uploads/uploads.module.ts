import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { IncidentRoomModule } from '../incident-room/incident-room.module';

@Module({
  imports: [IncidentRoomModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
