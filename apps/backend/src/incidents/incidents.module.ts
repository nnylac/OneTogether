import { Module } from '@nestjs/common';
import { IncidentsController, UnitsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  controllers: [IncidentsController, UnitsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
