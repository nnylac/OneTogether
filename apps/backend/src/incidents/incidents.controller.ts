import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { AssignOrganisationDto } from './assign-organisation.dto';
import { UpdateAssignedOrganisationDto } from './update-assigned-organisation.dto';
import { UpdateIncidentDto } from './update-incident.dto';

@Controller('incidents')
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Get()
  findAll() {
    return this.incidentsService.findAll();
  }

  @Post(':id/organisations')
  assignOrganisation(
    @Param('id') id: string,
    @Body() dto: AssignOrganisationDto,
  ) {
    return this.incidentsService.assignOrganisation(id, dto);
  }

  @Patch(':id/organisations/:organisationId')
  updateAssignedOrganisation(
    @Param('id') id: string,
    @Param('organisationId') organisationId: string,
    @Body() dto: UpdateAssignedOrganisationDto,
  ) {
    return this.incidentsService.updateAssignedOrganisation(
      id,
      organisationId,
      dto,
    );
  }

  @Get(':id/logs')
  findLogs(@Param('id') id: string) {
    return this.incidentsService.findLogs(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateIncidentDto) {
    return this.incidentsService.update(id, dto);
  }
}
