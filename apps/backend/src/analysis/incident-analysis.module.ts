import { Module } from '@nestjs/common';
import { IncidentAnalysisService } from './incident-analysis.service';
import { ClassificationRefinementService } from './classification-refinement.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [IncidentAnalysisService, ClassificationRefinementService],
  exports: [IncidentAnalysisService, ClassificationRefinementService],
})
export class IncidentAnalysisModule {}
