import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportAiService } from '../ai/report-ai.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [ReportsController],
  providers: [ReportsService, ReportAiService],
  exports: [ReportsService],
})
export class ReportsModule {}
