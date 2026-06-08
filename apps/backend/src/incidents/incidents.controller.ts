import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { AssignOrganisationDto } from './assign-organisation.dto';
import { UpdateAssignedOrganisationDto } from './update-assigned-organisation.dto';
import { UpdateIncidentDto } from './update-incident.dto';
import { IncidentAnalysisService } from '../analysis/incident-analysis.service';

@Controller('incidents')
export class IncidentsController {
  constructor(
    private readonly incidentsService: IncidentsService,
    private readonly analysisService: IncidentAnalysisService,
  ) {}

  @Get()
  findAll(@Query('organisationId') organisationId?: string) {
    return this.incidentsService.findAll({ organisationId });
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

  @Get(':id/final-analysis')
  getFinalAnalysis(@Param('id') id: string) {
    return this.analysisService.getFinalAnalysis(id);
  }

  @Post(':id/final-analysis')
  generateFinalAnalysis(@Param('id') id: string) {
    return this.analysisService.generateFinalAnalysis(id, true);
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
