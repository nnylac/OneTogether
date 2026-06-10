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
import { IncidentAnalysisModule } from './analysis/incident-analysis.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { IncidentMiddlewareModule } from './incident-middleware/incident-middleware.module';
import { PrismaModule } from './prisma/prisma.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { GovernmentAlertsModule } from './government-alerts/government-alerts.module';
import { CommunityEventsModule } from './community-events/community-events.module';
import { AiModule } from './ai/ai.module';

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
    IncidentAnalysisModule,
    IntegrationsModule,
    IncidentMiddlewareModule,
    AnalyticsModule,
    GovernmentAlertsModule,
    CommunityEventsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
