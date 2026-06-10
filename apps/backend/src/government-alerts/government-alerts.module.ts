import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GovernmentAlertsController } from './government-alerts.controller';
import { GovernmentAlertsService } from './government-alerts.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [GovernmentAlertsController],
  providers: [GovernmentAlertsService],
  exports: [GovernmentAlertsService],
})
export class GovernmentAlertsModule {}

