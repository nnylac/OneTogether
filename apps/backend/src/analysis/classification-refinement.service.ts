import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { getIncidentSocketServer } from '../incident-room/socket-registry';

type RefinedClassification = {
  category: string;
  urgency: string;
  severity_estimate: number;
  confidence: number;
};

const CATEGORIES = [
  'fire',
  'flood',
  'medical emergency',
  'traffic accident',
  'gas leak',
  'building collapse',
  'missing person',
  'disease outbreak',
  'haze',
  'civil disturbance',
  'other',
];

/**
 * Asynchronously refines the instant keyword-based triage with an OpenAI
 * pass. Ingestion latency is unchanged (enqueue is synchronous) and every
 * failure mode leaves the keyword results untouched.
 */
@Injectable()
export class ClassificationRefinementService {
  private readonly logger = new Logger(ClassificationRefinementService.name);
  // queued = waiting in this.queue; running incidents that receive another
  // enqueue are marked dirty and re-run once, so rapid simulator updates
  // collapse to at most one in-flight + one pending call per incident.
  private readonly states = new Map<
    string,
    { queued: boolean; running: boolean; dirty: boolean }
  >();
  private readonly queue: string[] = [];
  private active = 0;
  private readonly maxConcurrent = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  enqueue(incidentId: string): void {
    if (!this.aiService.isClassificationEnabled) {
      return;
    }
    const state = this.states.get(incidentId) ?? {
      queued: false,
      running: false,
      dirty: false,
    };
    if (state.running) {
      state.dirty = true;
      this.states.set(incidentId, state);
      return;
    }
    if (state.queued) {
      return;
    }
    state.queued = true;
    this.states.set(incidentId, state);
    this.queue.push(incidentId);
    this.drain();
  }

  private drain(): void {
    while (this.active < this.maxConcurrent && this.queue.length > 0) {
      const incidentId = this.queue.shift();
      if (!incidentId) {
        return;
      }
      const state = this.states.get(incidentId);
      if (!state) {
        continue;
      }
      state.queued = false;
      state.running = true;
      this.active += 1;
      void this.refine(incidentId)
        .catch((error: unknown) => {
          this.logger.warn(
            `Classification refinement failed for ${incidentId}; keyword results stand: ${String(error)}`,
          );
        })
        .finally(() => {
          this.active -= 1;
          const current = this.states.get(incidentId);
          if (current) {
            current.running = false;
            if (current.dirty) {
              current.dirty = false;
              this.states.delete(incidentId);
              this.enqueue(incidentId);
            } else {
              this.states.delete(incidentId);
            }
          }
          this.drain();
        });
    }
  }

  private async refine(incidentId: string): Promise<void> {
    // Re-read at execution time so the refinement sees the freshest logs.
    const incident = await this.prisma.incidents.findUnique({
      where: { id: incidentId },
      include: { logs: { orderBy: { created_at: 'desc' }, take: 100 } },
    });
    if (!incident) {
      return;
    }

    const refined = await this.aiService.completeJson<RefinedClassification>({
      schemaName: 'incident_classification',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['category', 'urgency', 'severity_estimate', 'confidence'],
        properties: {
          category: { type: 'string', enum: CATEGORIES },
          urgency: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
          },
          severity_estimate: { type: 'integer', minimum: 1, maximum: 5 },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
      maxOutputTokens: 200,
      temperature: 0.1,
      system: [
        'You refine a rule-based triage of an emergency incident reported to',
        "Singapore's OneTogether coordination platform. Reclassify only from",
        'the evidence in the incident record and logs. If the evidence is',
        'ambiguous, keep the rule-based values and lower the confidence.',
      ].join(' '),
      user: JSON.stringify({
        ruleBasedResult: {
          category: incident.category,
          urgency: incident.urgency,
          severity_estimate: incident.severity_estimate,
          confidence: incident.confidence,
        },
        title: incident.title,
        type: incident.incident_type,
        reportedSeverity: incident.severity,
        location: incident.inc_location,
        description: incident.inc_description?.slice(0, 1000) ?? null,
        logs: incident.logs.map((log) => log.content.slice(0, 400)).reverse(),
      }),
    });

    // Don't clobber a final state if the incident closed while we were
    // waiting on the model.
    const latest = await this.prisma.incidents.findUnique({
      where: { id: incidentId },
      select: { inc_status: true },
    });
    if (!latest || latest.inc_status === 'CLOSED') {
      return;
    }

    const severityEstimate = Math.min(
      5,
      Math.max(1, Math.round(refined.severity_estimate)),
    );
    const confidence = Math.min(1, Math.max(0, refined.confidence));
    await this.prisma.incidents.update({
      where: { id: incidentId },
      data: {
        category: refined.category,
        urgency: refined.urgency,
        severity_estimate: severityEstimate,
        confidence,
        severity: severityEstimate,
        confidence_score: Math.round(confidence * 100),
      },
    });

    // Best-effort live update for anyone in the incident room; list and map
    // views already poll every ~10s.
    getIncidentSocketServer()
      ?.to(`incident:${incidentId}`)
      .emit('incident.analysis.updated', {
        incidentId,
        category: refined.category,
        urgency: refined.urgency,
        severityEstimate,
        confidence,
      });
  }
}
