import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('incidents/:incidentId/reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  @Get()
  list(@Param('incidentId') incidentId: string) {
    return this.svc.listByIncident(incidentId);
  }

  @Post()
  getOrCreate(
    @Param('incidentId') incidentId: string,
    @Body() body: { createdBy: string; createdByName: string },
  ) {
    return this.svc.getOrCreate(incidentId, body.createdBy, body.createdByName);
  }

  @Patch(':id/content')
  updateContent(@Param('id') id: string, @Body() body: { content: string }) {
    return this.svc.update(id, body.content);
  }

  @Patch(':id/title')
  updateTitle(@Param('id') id: string, @Body() body: { title: string }) {
    return this.svc.updateTitle(id, body.title);
  }

  @Post(':id/finalize')
  finalize(
    @Param('incidentId') incidentId: string,
    @Param('id') id: string,
    @Body() body: { userId: string; userName: string },
  ) {
    return this.svc.finalize(id, body.userId, body.userName, incidentId);
  }
}
