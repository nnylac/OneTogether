import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { IncidentRoomModule } from './incident-room/incident-room.module';
import { IncidentsModule } from './incidents/incidents.module';
import { MockController } from './mock.controller';
import { MockService } from './mock.service';
import { PrismaModule } from './prisma/prisma.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    PrismaModule,
    AiModule,
    AuthModule,
    ChatModule,
    IncidentsModule,
    IncidentRoomModule,
    UploadsModule,
  ],
  controllers: [MockController],
  providers: [MockService],
})
export class AppModule {}
