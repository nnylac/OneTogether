import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrganisationsModule } from './organisations/organisations.module';
import { IncidentsModule } from './incidents/incidents.module';
import { IncidentRoomModule } from './incident-room/incident-room.module';
import { ResourcesModule } from './resources/resources.module';
import { BroadcastsModule } from './broadcasts/broadcasts.module';
import { VolunteerModule } from './volunteer/volunteer.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MapsModule } from './maps/maps.module';
import { AiModule } from './ai/ai.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    OrganisationsModule,
    IncidentsModule,
    IncidentRoomModule,
    ResourcesModule,
    BroadcastsModule,
    VolunteerModule,
    NotificationsModule,
    MapsModule,
    AiModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
