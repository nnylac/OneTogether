import { Module } from '@nestjs/common';
import { OrganisationsController } from './organisations.controller';
import { OrganisationsRepository } from './organisations.repository';
import { OrganisationsService } from './organisations.service';

@Module({
  controllers: [OrganisationsController],
  providers: [OrganisationsService, OrganisationsRepository],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
