import { Module } from '@nestjs/common';
import { IncidentAnalysisService } from './incident-analysis.service';

@Module({
  providers: [IncidentAnalysisService],
  exports: [IncidentAnalysisService],
})
export class IncidentAnalysisModule {}
