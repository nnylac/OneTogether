import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { AiBroadcastService } from './ai-broadcast.service';
import { AiTranslationService } from './ai-translation.service';
import { SituationSummaryService } from './situation-summary.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ResourcesModule } from '../resources/resources.module';
import { GovernmentAlertsModule } from '../government-alerts/government-alerts.module';

@Module({
  imports: [AnalyticsModule, ResourcesModule, GovernmentAlertsModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiBroadcastService,
    AiTranslationService,
    SituationSummaryService,
  ],
  exports: [AiService, AiTranslationService],
})
export class AiModule {}
