import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';
import { deriveRegion, REGIONS, type Region } from '../common/derive-region.util';

export type BroadcastDraftRequest = {
  audience: 'Public' | 'Responders' | 'Zone';
  zone: string;
  severity: 'info' | 'advisory' | 'warning' | 'critical';
  responderOrganisationNames?: string[];
};

export type BroadcastDraftResponse = {
  title: string;
  message: string;
  groundedIncidentCount: number;
};

type TranslationEntry = { title: string; message: string };

export type BroadcastTranslations = {
  translations: {
    en: TranslationEntry;
    zh: TranslationEntry;
    ms: TranslationEntry;
    ta: TranslationEntry;
  };
};

@Injectable()
export class AiBroadcastService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async draftBroadcast(
    request: BroadcastDraftRequest,
  ): Promise<BroadcastDraftResponse> {
    const incidents = await this.prisma.incidents.findMany({
      where: { inc_status: { notIn: ['CLOSED', 'RESOLVED'] } },
      orderBy: { created_at: 'desc' },
      take: 20,
      select: {
        title: true,
        incident_type: true,
        severity: true,
        inc_location: true,
        category: true,
        urgency: true,
        latitude: true,
        longitude: true,
      },
    });

    // The broadcast zones (incl. 'South'/'Nationwide') don't map 1:1 to the
    // analytics regions — fall back to all active incidents on any mismatch.
    const zone = request.zone as Region;
    const grounded =
      request.audience === 'Zone' &&
      REGIONS.includes(zone) &&
      zone !== 'Unknown'
        ? incidents.filter((incident) => deriveRegion(incident) === zone)
        : incidents;
    const scope = grounded.length > 0 ? grounded : incidents;

    const draft = await this.aiService.completeJson<{
      title: string;
      message: string;
    }>({
      schemaName: 'broadcast_draft',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'message'],
        properties: {
          title: { type: 'string', maxLength: 120 },
          message: { type: 'string' },
        },
      },
      maxOutputTokens: 400,
      temperature: 0.4,
      system: [
        'You draft official government emergency broadcasts for Singapore',
        "residents on the OneTogether platform. Reference the actual active",
        'situation (incident types and areas) without naming victims or',
        'speculating beyond the data. Give clear protective actions',
        'appropriate to the severity level. Title must be at most 120',
        'characters. Message should be 2-4 sentences and close with',
        "'Further updates will be provided through OneTogether.'",
      ].join(' '),
      user: JSON.stringify({
        audience: request.audience,
        zone: request.zone,
        severity: request.severity,
        responderOrganisations: request.responderOrganisationNames ?? [],
        activeIncidents: scope.map((incident) => ({
          title: incident.title,
          type: incident.incident_type,
          severity: incident.severity,
          category: incident.category,
          urgency: incident.urgency,
          location: incident.inc_location,
          region: deriveRegion(incident),
        })),
      }),
    });

    return {
      title: draft.title.slice(0, 120),
      message: draft.message,
      groundedIncidentCount: scope.length,
    };
  }

  async translateBroadcast(input: {
    title: string;
    message: string;
  }): Promise<BroadcastTranslations> {
    const entrySchema = {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'message'],
      properties: {
        title: { type: 'string' },
        message: { type: 'string' },
      },
    };

    const translations = await this.aiService.completeJson<
      BroadcastTranslations['translations']
    >({
      schemaName: 'broadcast_translations',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['en', 'zh', 'ms', 'ta'],
        properties: {
          en: entrySchema,
          zh: entrySchema,
          ms: entrySchema,
          ta: entrySchema,
        },
      },
      maxOutputTokens: 1500,
      temperature: 0.2,
      system: [
        'Translate this official Singapore government emergency broadcast',
        'into Simplified Chinese (zh), Malay (ms) and Tamil (ta), preserving',
        'the meaning, urgency, and official register. Return the English',
        'original unchanged as en.',
      ].join(' '),
      user: JSON.stringify(input),
    });

    return { translations };
  }
}
