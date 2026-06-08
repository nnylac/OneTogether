import { Module } from '@nestjs/common';
import { BroadcastsController } from './broadcasts.controller';
import { BroadcastsRepository } from './broadcasts.repository';
import { BroadcastsService } from './broadcasts.service';

@Module({
  controllers: [BroadcastsController],
  providers: [BroadcastsService, BroadcastsRepository],
  exports: [BroadcastsService],
})
export class BroadcastsModule {}
