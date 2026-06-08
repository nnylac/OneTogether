import { Module } from '@nestjs/common';
import { IncidentMiddlewareController } from './incident-middleware.controller';
import { IncidentMiddlewareService } from './incident-middleware.service';
import { IncidentNormalizerService } from './incident-normalizer.service';
import { SemanticIncidentAnalyzerService } from './semantic-incident-analyzer.service';
import { IncidentAnalysisModule } from '../analysis/incident-analysis.module';

@Module({
  imports: [IncidentAnalysisModule],
  controllers: [IncidentMiddlewareController],
  providers: [
    IncidentMiddlewareService,
    IncidentNormalizerService,
    SemanticIncidentAnalyzerService,
  ],
})
export class IncidentMiddlewareModule {}
