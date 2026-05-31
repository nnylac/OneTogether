import { Module } from '@nestjs/common';
import { IncidentsController, UnitsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { GeocodingService } from './geocoding.service';
import { OverpassService } from './overpass.service';
import { PoisController } from './pois.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [IncidentsController, UnitsController, PoisController],
  providers: [IncidentsService, GeocodingService, OverpassService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
