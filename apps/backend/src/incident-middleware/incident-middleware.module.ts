import { Module } from '@nestjs/common';
import { IncidentMiddlewareController } from './incident-middleware.controller';
import { IncidentMiddlewareService } from './incident-middleware.service';
import { IncidentNormalizerService } from './incident-normalizer.service';
import { IncidentResourceExtractorService } from './incident-resource-extractor.service';
import { SemanticIncidentAnalyzerService } from './semantic-incident-analyzer.service';

@Module({
  controllers: [IncidentMiddlewareController],
  providers: [
    IncidentMiddlewareService,
    IncidentNormalizerService,
    IncidentResourceExtractorService,
    SemanticIncidentAnalyzerService,
  ],
})
export class IncidentMiddlewareModule {}
