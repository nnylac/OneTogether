import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { MockService } from './mock.service';

@Controller()
export class MockController {
  constructor(private readonly mock: MockService) {}

  @Get('users')
  users() { return this.mock.get('users'); }

  @Get('organisations')
  organisations() { return this.mock.get('organisations'); }

  @Get('incidents')
  incidents() { return this.mock.get('incidents'); }

  @Post('incidents')
  createIncident(@Body() body: Record<string, unknown>) { return this.mock.create('incidents', body); }

  @Patch('incidents/:id')
  patchIncident(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.mock.patch('incidents', id, body); }

  @Post('incidents/:id/assign')
  assignIncident(@Param('id') id: string, @Body('organisationId') organisationId: string) { return this.mock.assignIncident(id, organisationId); }

  @Post('incidents/:id/make-public')
  makePublic(@Param('id') id: string) { return this.mock.makeIncidentPublic(id); }

  @Get('broadcasts')
  broadcasts() { return this.mock.get('broadcasts'); }

  @Post('broadcasts')
  createBroadcast(@Body() body: Record<string, unknown>) { return this.mock.create('broadcasts', body); }

  @Get('hospitals')
  hospitals() { return this.mock.get('hospitals'); }

  @Patch('hospitals/:id')
  patchHospital(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.mock.patch('hospitals', id, body); }

  @Get('volunteer-tasks')
  volunteerTasks() { return this.mock.get('volunteerTasks'); }

  @Post('volunteer-tasks')
  createVolunteerTask(@Body() body: Record<string, unknown>) { return this.mock.create('volunteerTasks', body); }

  @Get('community-programmes')
  communityProgrammes() { return this.mock.get('communityProgrammes'); }

  @Get('thresholds')
  thresholds() { return this.mock.get('thresholds'); }

  @Patch('thresholds/:id')
  patchThreshold(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.mock.patch('thresholds', id, body); }

  @Get('notifications')
  notifications() { return this.mock.get('notifications'); }
}
