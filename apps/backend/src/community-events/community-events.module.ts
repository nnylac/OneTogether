import { Module } from '@nestjs/common';
import { CommunityEventsController } from './community-events.controller';
import { CommunityEventsService } from './community-events.service';

@Module({
  controllers: [CommunityEventsController],
  providers: [CommunityEventsService],
})
export class CommunityEventsModule {}
