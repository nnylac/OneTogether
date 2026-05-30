import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { MockService } from './mock.service';

@Controller()
export class MockController {
  constructor(private readonly mock: MockService) {}

  @Get('health')
  health() { return { status: 'ok' }; }

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

  @Post('incidents/:id/advance-status')
  advanceStatus(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.mock.advanceIncidentStatus(id, body); }

  @Post('incidents/:id/timeline')
  addTimeline(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.mock.addTimelineEntry(id, body); }

  @Get('broadcasts')
  broadcasts() { return this.mock.get('broadcasts'); }

  @Post('broadcasts')
  createBroadcast(@Body() body: Record<string, unknown>) { return this.mock.create('broadcasts', body); }

  @Delete('broadcasts/:id')
  @HttpCode(204)
  deleteBroadcast(@Param('id') id: string) { return this.mock.delete('broadcasts', id); }

  @Get('hospitals')
  hospitals() { return this.mock.get('hospitals'); }

  @Patch('hospitals/:id')
  patchHospital(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.mock.patch('hospitals', id, body); }

  @Get('volunteer-tasks')
  volunteerTasks() { return this.mock.get('volunteerTasks'); }

  @Post('volunteer-tasks')
  createVolunteerTask(@Body() body: Record<string, unknown>) { return this.mock.create('volunteerTasks', body); }

  @Post('volunteer-tasks/:id/signup')
  signupTask(@Param('id') id: string) { return this.mock.signupTask(id); }

  @Get('community-programmes')
  communityProgrammes() { return this.mock.get('communityProgrammes'); }

  @Post('community-programmes/:id/register')
  registerProgramme(@Param('id') id: string) { return this.mock.registerProgramme(id); }

  @Get('thresholds')
  thresholds() { return this.mock.get('thresholds'); }

  @Patch('thresholds/:id')
  patchThreshold(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.mock.patch('thresholds', id, body); }

  @Get('units')
  units() { return this.mock.get('units'); }

  @Patch('units/:id')
  patchUnit(@Param('id') id: string, @Body() body: Record<string, unknown>) { return this.mock.patch('units', id, body); }

  @Get('notifications')
  notifications() { return this.mock.get('notifications'); }
}
