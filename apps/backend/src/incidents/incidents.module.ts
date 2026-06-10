import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentAnalysisModule } from '../analysis/incident-analysis.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, IncidentAnalysisModule, NotificationsModule],
  controllers: [IncidentsController],
  providers: [IncidentsService],
})
export class IncidentsModule {}
