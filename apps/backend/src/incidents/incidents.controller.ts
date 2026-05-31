import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { IncidentsService } from './incidents.service';

@Controller('incidents')
export class IncidentsController {
  constructor(private service: IncidentsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: {
    title: string;
    type: string;
    severity: string;
    description: string;
    location: string;
    zone?: string;
    createdBy: string;
    publicVisibility?: string;
  }) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(id, body);
  }

  // Timeline
  @Get(':id/timeline')
  getTimeline(@Param('id') id: string) {
    return this.service.findOne(id).then((inc) => inc.timeline);
  }

  @Post(':id/timeline')
  addTimeline(
    @Param('id') id: string,
    @Body() body: { actor?: string; organisation?: string; category: string; text: string },
  ) {
    return this.service.addTimelineEvent(id, body);
  }

  // Resources
  @Get(':id/resources')
  getResources(@Param('id') id: string) {
    return this.service.getResources(id);
  }

  @Post(':id/resources')
  assignUnit(@Param('id') id: string, @Body() body: { unitId: string }) {
    return this.service.assignUnit(id, body.unitId);
  }

  @Patch(':id/resources/:unitId')
  updateUnit(
    @Param('id') id: string,
    @Param('unitId') unitId: string,
    @Body() body: { status: string },
  ) {
    return this.service.updateUnitStatus(id, unitId, body.status);
  }

  @Delete(':id/resources/:unitId')
  unassignUnit(@Param('id') id: string, @Param('unitId') unitId: string) {
    return this.service.unassignUnit(id, unitId);
  }

  @Patch(':id/location')
  setLocation(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number; boundaryGeoJson?: string },
  ) {
    return this.service.setLocation(id, body.latitude, body.longitude, body.boundaryGeoJson);
  }

  @Post(':id/geocode')
  geocode(@Param('id') id: string) {
    return this.service.geocodeIncident(id);
  }

  @Get(':id/nearby-infrastructure')
  nearbyInfrastructure(
    @Param('id') id: string,
    @Query('radius') radius?: string,
  ) {
    return this.service.getNearbyInfrastructure(id, radius ? parseInt(radius, 10) : 2000);
  }

  @Get(':id/ai-resource-suggestions')
  aiResourceSuggestions(@Param('id') id: string) {
    return this.service.getAiResourceSuggestions(id);
  }
}

@Controller('units')
export class UnitsController {
  constructor(private service: IncidentsService) {}

  @Get()
  getAvailable(@Query('orgId') orgId?: string) {
    return this.service.getAvailableUnits(orgId);
  }
}
