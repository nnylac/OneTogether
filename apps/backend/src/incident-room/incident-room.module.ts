import { Module } from '@nestjs/common';
import { IncidentRoomGateway } from './incident-room.gateway';
import { ChatModule } from '../chat/chat.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { AiModule } from '../ai/ai.module';
import { ReportsModule } from '../reports/reports.module';

@Module({
  imports: [ChatModule, IncidentsModule, AiModule, ReportsModule],
  providers: [IncidentRoomGateway],
  exports: [IncidentRoomGateway],
})
export class IncidentRoomModule {}
