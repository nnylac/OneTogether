import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiUnavailableError } from './ai.service';
import {
  AiBroadcastService,
  type BroadcastDraftRequest,
} from './ai-broadcast.service';
import { SituationSummaryService } from './situation-summary.service';

const AUDIENCES = ['Public', 'Responders', 'Zone'];
const SEVERITIES = ['info', 'advisory', 'warning', 'critical'];

// NOTE: like every other controller in this prototype, these endpoints are
// unauthenticated — there is no global JWT guard yet. Known gap.
@Controller('ai')
export class AiController {
  constructor(
    private readonly aiBroadcastService: AiBroadcastService,
    private readonly situationSummaryService: SituationSummaryService,
  ) {}

  @Post('broadcast-draft')
  async draftBroadcast(@Body() body: Partial<BroadcastDraftRequest>) {
    if (!body.audience || !AUDIENCES.includes(body.audience)) {
      throw new BadRequestException('audience must be Public|Responders|Zone');
    }
    if (!body.severity || !SEVERITIES.includes(body.severity)) {
      throw new BadRequestException(
        'severity must be info|advisory|warning|critical',
      );
    }

    try {
      return await this.aiBroadcastService.draftBroadcast({
        audience: body.audience,
        zone: body.zone ?? 'Nationwide',
        severity: body.severity,
        responderOrganisationNames: body.responderOrganisationNames ?? [],
      });
    } catch (error) {
      if (error instanceof AiUnavailableError) {
        // 503 lets the frontend fall back to its local template draft.
        throw new ServiceUnavailableException('AI drafting is unavailable');
      }
      throw error;
    }
  }

  @Post('translate')
  async translateBroadcast(@Body() body: { title?: string; message?: string }) {
    if (!body.title?.trim() || !body.message?.trim()) {
      throw new BadRequestException('title and message are required');
    }

    try {
      return await this.aiBroadcastService.translateBroadcast({
        title: body.title,
        message: body.message,
      });
    } catch (error) {
      if (error instanceof AiUnavailableError) {
        throw new ServiceUnavailableException('AI translation is unavailable');
      }
      throw error;
    }
  }

  @Get('situation-summary')
  async situationSummary(@Query('refresh') refresh?: string) {
    // Always 200 — the service returns a deterministic fallback payload when
    // AI is unavailable so the government dashboard never breaks.
    return this.situationSummaryService.getSituationSummary(refresh === 'true');
  }
}
