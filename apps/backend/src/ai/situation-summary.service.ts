import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService, AiUnavailableError } from './ai.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ResourcesService } from '../resources/resources.service';
import { GovernmentAlertsService } from '../government-alerts/government-alerts.service';

export type SituationSummarySections = {
  overview: string;
  keyRisks: string;
  resourcePosture: string;
  recommendedActions: string;
};

export type SituationSummaryPayload = {
  generatedAt: string;
  source: 'ai' | 'fallback';
  sections: SituationSummarySections | null;
  fallbackText: string | null;
};

const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class SituationSummaryService {
  private readonly logger = new Logger(SituationSummaryService.name);
  // Per-pod cache: with multiple replicas each pod keeps its own copy, which
  // is acceptable for a 5-minute advisory briefing in this prototype.
  private cache: { expiresAt: number; payload: SituationSummaryPayload } | null =
    null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly analyticsService: AnalyticsService,
    private readonly resourcesService: ResourcesService,
    private readonly governmentAlertsService: GovernmentAlertsService,
  ) {}

  async getSituationSummary(refresh = false): Promise<SituationSummaryPayload> {
    if (!refresh && this.cache && this.cache.expiresAt > Date.now()) {
      return this.cache.payload;
    }

    const [overview, resourceSummary, alertRules, activeIncidents] =
      await Promise.all([
        this.analyticsService.findOverview({}),
        this.resourcesService.findSummary().catch(() => null),
        this.governmentAlertsService.findAll().catch(() => []),
        this.prisma.incidents.findMany({
          where: { inc_status: { notIn: ['CLOSED', 'RESOLVED'] } },
          orderBy: { created_at: 'desc' },
          take: 15,
          select: {
            title: true,
            incident_type: true,
            severity: true,
            inc_location: true,
            inc_status: true,
            urgency: true,
          },
        }),
      ]);

    const triggeredRules = (
      alertRules as Array<{ status?: string; name?: string; metric?: string }>
    ).filter((rule) => rule.status && rule.status !== 'Normal');

    const aggregate = {
      totals: overview.data.totals,
      incidentsByType: overview.data.incidentsByType,
      incidentsByRegion: overview.data.incidentsByRegion,
      severityDistribution: overview.data.severityDistribution,
      resourceTotals: resourceSummary?.totals ?? null,
      criticalOutlets:
        resourceSummary?.criticalOutlets?.map(
          (outlet: { name?: string; region?: string | null }) => ({
            name: outlet.name,
            region: outlet.region,
          }),
        ) ?? [],
      triggeredAlertRules: triggeredRules.map((rule) => ({
        name: rule.name,
        metric: rule.metric,
        status: rule.status,
      })),
      activeIncidents,
    };

    let payload: SituationSummaryPayload;
    try {
      const sections = await this.aiService.completeJson<SituationSummarySections>(
        {
          schemaName: 'situation_summary',
          schema: {
            type: 'object',
            additionalProperties: false,
            required: [
              'overview',
              'keyRisks',
              'resourcePosture',
              'recommendedActions',
            ],
            properties: {
              overview: { type: 'string' },
              keyRisks: { type: 'string' },
              resourcePosture: { type: 'string' },
              recommendedActions: { type: 'string' },
            },
          },
          maxOutputTokens: 900,
          temperature: 0.3,
          system: [
            "You are the duty officer writing a commander's situation",
            "briefing for Singapore's national emergency dashboard",
            '(OneTogether). Be specific with numbers taken from the supplied',
            'data and never invent figures. Explicitly flag any triggered',
            'alert rules and critical resource outlets. Keep the four',
            'sections to 3-6 short paragraphs in total.',
          ].join(' '),
          user: JSON.stringify(aggregate),
        },
      );
      payload = {
        generatedAt: new Date().toISOString(),
        source: 'ai',
        sections,
        fallbackText: null,
      };
    } catch (error) {
      if (!(error instanceof AiUnavailableError)) {
        throw error;
      }
      this.logger.warn(
        `AI situation summary unavailable; serving aggregate fallback: ${String(error)}`,
      );
      payload = {
        generatedAt: new Date().toISOString(),
        source: 'fallback',
        sections: null,
        fallbackText: this.buildFallbackText(aggregate),
      };
    }

    this.cache = { expiresAt: Date.now() + CACHE_TTL_MS, payload };
    return payload;
  }

  private buildFallbackText(aggregate: {
    totals: {
      totalIncidents: number;
      activeIncidents: number;
      criticalIncidents: number;
    };
    triggeredAlertRules: Array<{ name?: string }>;
    criticalOutlets: Array<{ name?: string }>;
  }): string {
    const parts = [
      `${aggregate.totals.activeIncidents} active incident${
        aggregate.totals.activeIncidents === 1 ? '' : 's'
      } (${aggregate.totals.criticalIncidents} critical) out of ${
        aggregate.totals.totalIncidents
      } in the reporting window.`,
    ];
    if (aggregate.triggeredAlertRules.length > 0) {
      parts.push(
        `${aggregate.triggeredAlertRules.length} alert rule${
          aggregate.triggeredAlertRules.length === 1 ? ' is' : 's are'
        } triggered: ${aggregate.triggeredAlertRules
          .map((rule) => rule.name)
          .filter(Boolean)
          .join(', ')}.`,
      );
    }
    if (aggregate.criticalOutlets.length > 0) {
      parts.push(
        `${aggregate.criticalOutlets.length} resource outlet${
          aggregate.criticalOutlets.length === 1 ? ' is' : 's are'
        } at critical availability.`,
      );
    }
    return parts.join(' ');
  }
}
