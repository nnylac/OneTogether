import { Module } from '@nestjs/common';
import { IncidentRoomGateway } from './incident-room.gateway';
import { ChatModule } from '../chat/chat.module';
import { IncidentsModule } from '../incidents/incidents.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ChatModule, IncidentsModule, AiModule],
  providers: [IncidentRoomGateway],
  exports: [IncidentRoomGateway],
})
export class IncidentRoomModule {}
