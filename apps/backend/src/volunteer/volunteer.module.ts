import { Module } from '@nestjs/common';
import { VolunteerController } from './volunteer.controller';
import { VolunteerOpportunitiesPublicController } from './volunteer-opportunities-public.controller';
import { VolunteerRepository } from './volunteer.repository';
import { VolunteerService } from './volunteer.service';

@Module({
  controllers: [VolunteerController, VolunteerOpportunitiesPublicController],
  providers: [VolunteerService, VolunteerRepository],
  exports: [VolunteerService],
})
export class VolunteerModule {}
