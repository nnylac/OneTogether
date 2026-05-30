import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Post('sitrep')
  async sitrep(@Body() incident: Record<string, unknown>) {
    try { return await this.ai.generateSitrep(incident); }
    catch (e) { throw new HttpException((e as Error).message ?? 'AI unavailable', HttpStatus.SERVICE_UNAVAILABLE); }
  }

  @Post('broadcast-draft')
  async broadcastDraft(@Body() body: { incidentType: string; location: string; severity: string; description: string; audience: string }) {
    try { return await this.ai.generateBroadcastDraft(body); }
    catch (e) { throw new HttpException((e as Error).message ?? 'AI unavailable', HttpStatus.SERVICE_UNAVAILABLE); }
  }

  @Post('suggest-tasks')
  async suggestTasks(@Body() body: { incidents: Record<string, unknown>[]; organisations: Record<string, unknown>[] }) {
    try { return await this.ai.suggestTaskAssignments(body.incidents, body.organisations); }
    catch (e) { throw new HttpException((e as Error).message ?? 'AI unavailable', HttpStatus.SERVICE_UNAVAILABLE); }
  }

  @Post('citizen-guidance')
  async citizenGuidance(@Body() body: { incidentType: string; description: string }) {
    try { return await this.ai.getCitizenGuidance(body.incidentType, body.description); }
    catch (e) { throw new HttpException((e as Error).message ?? 'AI unavailable', HttpStatus.SERVICE_UNAVAILABLE); }
  }
}
