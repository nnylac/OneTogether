import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

export type IncidentClassification = {
  category: string;
  urgency: string;
  severity_estimate: number;
  confidence: number;
};

type CategoryRule = {
  category: string;
  terms: Array<[term: string, weight: number]>;
};

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'fire',
    terms: [
      ['building fire', 5],
      ['visible flames', 4],
      ['fire engine', 3],
      ['smoke', 2],
      ['burning', 2],
      ['fire', 2],
    ],
  },
  {
    category: 'flood',
    terms: [
      ['flash flood', 5],
      ['flooding', 4],
      ['water level', 3],
      ['drain overflow', 3],
      ['portable pump', 2],
      ['flood', 2],
    ],
  },
  {
    category: 'medical emergency',
    terms: [
      ['cardiac arrest', 5],
      ['medical emergency', 5],
      ['unresponsive', 4],
      ['cpr', 4],
      ['food poisoning', 4],
      ['breathing difficulty', 4],
      ['unconscious', 4],
      ['allergic reaction', 4],
      ['stroke', 4],
      ['seizure', 4],
      ['patient', 2],
      ['ambulance', 2],
      ['paramedic', 2],
    ],
  },
  {
    category: 'traffic accident',
    terms: [
      ['traffic accident', 5],
      ['multi-vehicle', 4],
      ['collision', 4],
      ['hit and run', 4],
      ['road accident', 4],
      ['overturned', 3],
      ['pedestrian struck', 4],
      ['crashed into', 3],
      ['lanes closed', 2],
    ],
  },
  {
    category: 'gas leak',
    terms: [
      ['gas leak', 5],
      ['gas smell', 4],
      ['hazmat', 3],
      ['pipeline rupture', 4],
      ['gas cylinder', 3],
      ['gas pipe', 3],
      ['gas odour', 3],
      ['gas detector', 3],
      ['gas concentration', 3],
      ['leak source', 2],
    ],
  },
  {
    category: 'building collapse',
    terms: [
      ['building collapse', 5],
      ['structural collapse', 5],
      ['persons trapped', 4],
      ['collapsed', 4],
      ['collapse', 3],
      ['retaining wall', 3],
      ['scaffolding', 3],
      ['structural failure', 4],
      ['usar', 4],
      ['debris', 3],
      ['structural engineer', 2],
    ],
  },
  {
    category: 'missing person',
    terms: [
      ['missing person', 5],
      ['reported missing', 4],
      ['missing since', 4],
      ['overdue', 3],
      ['separated from family', 3],
      ['last seen', 4],
      ['search operation', 3],
      ['subject located', 3],
      ['cctv review', 2],
    ],
  },
  {
    category: 'disease outbreak',
    terms: [
      ['disease outbreak', 5],
      ['suspected outbreak', 5],
      ['gastroenteritis', 4],
      ['dengue', 4],
      ['respiratory illness', 4],
      ['foodborne illness', 4],
      ['hand, foot and mouth', 4],
      ['infectious illness', 4],
      ['mosquito-borne illness', 4],
      ['vomiting and diarrhoea', 4],
      ['cluster of', 3],
      ['breeding sites', 3],
      ['vector control', 3],
      ['fogging', 2],
    ],
  },
  {
    category: 'haze',
    terms: [
      ['haze', 5],
      ['psi', 4],
      ['air quality', 3],
      ['burning smell', 2],
      ['respiratory discomfort', 3],
      ['school closure', 2],
    ],
  },
  {
    category: 'civil disturbance',
    terms: [
      ['civil disturbance', 5],
      ['crowd control', 4],
      ['public disorder', 4],
      ['riot', 4],
      ['demonstration', 2],
      ['public order', 3],
      ['crowd', 3],
      ['confrontation', 3],
      ['protest', 3],
      ['fights', 3],
      ['public disturbance', 4],
    ],
  },
];

const CRITICAL_TERMS = [
  'deceased',
  'fatality',
  'dead',
  'cardiac arrest',
  'cpr',
  'unresponsive',
  'unconscious',
  'possible stroke',
  'seizure',
  'severe allergic reaction',
  'serious allergic reaction',
  'severe breathing difficulty',
  'persons trapped',
  'workers trapped',
  'rider trapped',
  'resident possibly trapped',
  'elderly residents trapped',
  'explosion',
  'critical patient',
  'unaccounted for',
];
const HIGH_TERMS = [
  'injured',
  'casualties',
  'evacuated',
  'visible flames',
  'hazmat',
  'building collapse',
  'structural failure',
  'multi-vehicle',
  'pedestrian struck',
  'crowd surge',
  'hospital transfer',
  'ambulance requested',
];
const AGENCIES = ['SPF', 'SCDF', 'NEA', 'PUB', 'MOH', 'SINGHEALTH', 'NUHS'];
const HOSPITALS = ['SGH', 'NUH', 'CGH', 'NTFGH', 'SKH', 'KKH'];

@Injectable()
export class IncidentAnalysisService implements OnApplicationBootstrap {
  private readonly logger = new Logger(IncidentAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async onApplicationBootstrap() {
    const incidents = await this.prisma.incidents.findMany({
      select: {
        id: true,
        inc_status: true,
        analysis_status: true,
      },
    });

    for (const incident of incidents) {
      await this.analyzeIncidentTimeline(incident.id);
      if (
        incident.inc_status === 'CLOSED' &&
        incident.analysis_status !== 'COMPLETED'
      ) {
        // Boot-time backfill loops every closed incident — keep it on the
        // free rules path so a pod restart never fires N OpenAI calls.
        await this.generateFinalAnalysis(incident.id, true, { useAi: false });
      }
    }
  }

  async analyzeIncidentTimeline(incidentId: string) {
    const incident = await this.prisma.incidents.findUnique({
      where: { id: incidentId },
      include: {
        logs: { orderBy: { created_at: 'asc' } },
      },
    });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    const evidence = [
      incident.incident_type,
      incident.title,
      incident.inc_description,
      incident.inc_location,
      ...incident.logs.map((log) => log.content),
    ]
      .filter(Boolean)
      .join(' ');
    const priority = this.highestPriority(evidence);
    const result = this.classifyIncident(evidence, incident.severity, priority);

    await this.prisma.incidents.update({
      where: { id: incidentId },
      data: {
        category: result.category,
        urgency: result.urgency,
        severity_estimate: result.severity_estimate,
        confidence: result.confidence,
        severity: result.severity_estimate,
        confidence_score: Math.round(result.confidence * 100),
      },
    });

    return result;
  }

  classifyIncident(
    text: string,
    reportedSeverity = 2,
    priority?: string,
  ): IncidentClassification {
    const normalized = text.toLowerCase().replace(/_/g, ' ');
    const scores = CATEGORY_RULES.map((rule) => ({
      category: rule.category,
      score: rule.terms.reduce(
        (total, [term, weight]) =>
          total + (normalized.includes(term) ? weight : 0),
        0,
      ),
    })).sort((left, right) => right.score - left.score);

    const best = scores[0];
    const runnerUp = scores[1];
    const category = best.score > 0 ? best.category : 'other';
    const evidenceCount = this.countMatches(normalized, [
      ...CRITICAL_TERMS,
      ...HIGH_TERMS,
    ]);
    const margin = Math.max(0, best.score - runnerUp.score);
    const confidence = this.clamp(
      best.score === 0
        ? 0.5
        : 0.58 + best.score * 0.025 + margin * 0.02 + evidenceCount * 0.01,
      0.5,
      0.98,
    );

    let severity = this.clamp(Math.round(reportedSeverity), 1, 5);
    if (CRITICAL_TERMS.some((term) => normalized.includes(term))) {
      severity = Math.max(severity, 5);
    } else if (HIGH_TERMS.some((term) => normalized.includes(term))) {
      severity = Math.max(severity, 4);
    }
    if (priority?.toUpperCase() === 'P1') {
      severity = Math.max(severity, 4);
    }

    return {
      category,
      urgency:
        severity >= 5
          ? 'critical'
          : severity >= 4
            ? 'high'
            : severity >= 2
              ? 'medium'
              : 'low',
      severity_estimate: severity,
      confidence: Number(confidence.toFixed(3)),
    };
  }

  async getFinalAnalysis(incidentId: string) {
    const incident = await this.prisma.incidents.findUnique({
      where: { id: incidentId },
      select: {
        id: true,
        inc_status: true,
        analysis_status: true,
        executive_summary: true,
        response_plan: true,
        entities: true,
        analysis_finalized_at: true,
      },
    });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }

    return this.toFinalAnalysisDto(incident);
  }

  async generateFinalAnalysis(
    incidentId: string,
    force = false,
    options: { useAi?: boolean } = {},
  ) {
    const incident = await this.prisma.incidents.findUnique({
      where: { id: incidentId },
      include: {
        logs: { orderBy: { created_at: 'asc' } },
        assigned_orgs: {
          include: {
            organisations: {
              select: { org_name: true },
            },
          },
          orderBy: { assigned_at: 'asc' },
        },
        incident_sources: {
          orderBy: { last_synced_at: 'asc' },
        },
      },
    });
    if (!incident) {
      throw new NotFoundException('Incident not found');
    }
    if (incident.inc_status !== 'CLOSED') {
      throw new BadRequestException(
        'Final analysis can only be generated for a closed incident',
      );
    }
    if (
      !force &&
      incident.analysis_status === 'COMPLETED' &&
      incident.analysis_finalized_at
    ) {
      return { ...this.toFinalAnalysisDto(incident), generatedBy: null };
    }

    const agencies = incident.assigned_orgs.map(
      (assignment) => assignment.organisations.org_name,
    );
    const logs = incident.logs.map((log) => log.content);
    const input = {
      title: incident.title,
      incidentType: incident.incident_type,
      severity: incident.severity,
      location: incident.inc_location,
      agencies,
      logs,
    };

    let result: {
      executive_summary: string;
      response_plan: string;
      entities: string;
    } | null = null;
    let generatedBy: 'ai' | 'rules' = 'rules';
    if (options.useAi !== false && this.aiService.isEnabled) {
      try {
        result = await this.generateAiFinalReport({
          ...input,
          description: incident.inc_description,
          category: incident.category,
          urgency: incident.urgency,
          createdAt: incident.created_at,
          resolvedAt: incident.resolved_at,
        });
        generatedBy = 'ai';
      } catch (error) {
        this.logger.warn(
          `AI final report failed for ${incidentId}; using rule-based report: ${String(error)}`,
        );
      }
    }
    result ??= this.buildFinalReport(input);

    const updated = await this.prisma.incidents.update({
      where: { id: incidentId },
      data: {
        analysis_status: 'COMPLETED',
        executive_summary: result.executive_summary,
        response_plan: result.response_plan,
        entities: result.entities,
        analysis_finalized_at: new Date(),
        report: result.response_plan,
      },
    });

    return { ...this.toFinalAnalysisDto(updated), generatedBy };
  }

  private async generateAiFinalReport(input: {
    title: string;
    incidentType: string;
    severity: number;
    location: string | null;
    agencies: string[];
    logs: string[];
    description: string | null;
    category: string | null;
    urgency: string | null;
    createdAt: Date;
    resolvedAt: Date | null;
  }): Promise<{
    executive_summary: string;
    response_plan: string;
    entities: string;
  }> {
    // Cap the prompt size: most recent 100 logs, each trimmed to 400 chars.
    const logs = input.logs.slice(-100).map((log) => log.slice(0, 400));

    return this.aiService.completeJson({
      schemaName: 'incident_final_report',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['executive_summary', 'response_plan', 'entities'],
        properties: {
          executive_summary: { type: 'string' },
          response_plan: { type: 'string' },
          entities: { type: 'string' },
        },
      },
      maxOutputTokens: 1200,
      temperature: 0.3,
      system: [
        'You are an emergency operations after-action report writer for',
        "Singapore's OneTogether national coordination platform. Write",
        'factual, professional prose grounded ONLY in the supplied incident',
        'record and timeline logs. Never invent casualties, resources, or',
        'agencies that are not present in the data. Use British/Singapore',
        'English.',
        '- executive_summary: 3-5 sentences covering what happened, where,',
        '  the final severity, and how the incident concluded.',
        '- response_plan: one paragraph narrating the actual response',
        '  chronology from the logs.',
        '- entities: one readable paragraph covering the organisations,',
        '  location, casualties, resources, and hospitals mentioned.',
      ].join(' '),
      user: JSON.stringify({
        title: input.title,
        type: input.incidentType,
        severity: input.severity,
        category: input.category,
        urgency: input.urgency,
        location: input.location,
        description: input.description?.slice(0, 1000) ?? null,
        agencies: input.agencies,
        openedAt: input.createdAt.toISOString(),
        resolvedAt: input.resolvedAt?.toISOString() ?? null,
        logs,
      }),
    });
  }

  private buildFinalReport(input: {
    title: string;
    incidentType: string;
    severity: number;
    location: string | null;
    agencies: string[];
    logs: string[];
  }) {
    const location = input.location || 'an unspecified location';
    const agencyText =
      input.agencies.length > 0
        ? this.joinNatural(input.agencies)
        : 'the assigned response organisations';
    const updates = this.extractUpdates(input.logs);
    const conclusion =
      input.logs.find((log) =>
        /\b(closed|cleared|resolved|contained|stood down|returning to base)\b/i.test(
          log,
        ),
      ) ?? '';

    const executiveSummary = [
      `${input.title} was recorded at ${location} as a ${this.humanize(input.incidentType)} incident with a final severity of ${input.severity} out of 5.`,
      `${agencyText} coordinated the response across ${input.logs.length} recorded timeline update${input.logs.length === 1 ? '' : 's'}.`,
      conclusion
        ? `The timeline concluded with ${this.lowercaseFirst(this.cleanLog(conclusion))}`
        : 'The incident was closed after all assigned organisations completed their recorded work.',
    ].join(' ');

    const responsePlan =
      updates.length > 0
        ? `The response began with ${this.lowercaseFirst(updates[0])} ${
            updates.length > 1
              ? `It then progressed through ${updates
                  .slice(1, 4)
                  .map((update) => this.lowercaseFirst(update))
                  .join(' ')}`
              : ''
          } All assigned organisations subsequently completed their work and the incident was closed.`.replace(
            /\s+/g,
            ' ',
          )
        : `${agencyText} received and coordinated the incident record, monitored the assigned response, and closed the incident after all assigned organisations completed their work.`;

    return {
      executive_summary: executiveSummary,
      response_plan: responsePlan,
      entities: this.buildEntitiesParagraph(
        [input.title, location, ...input.logs].join(' '),
        input.agencies,
        location,
      ),
    };
  }

  private extractUpdates(logs: string[]) {
    const updates = logs
      .map((log) => {
        const match = log.match(
          /Update:\s*(.*?)(?=\sEvidence:|\sPossible duplicate|\sSome agency fields|$)/i,
        );
        return this.cleanLog(match?.[1] ?? '');
      })
      .filter((update) => update.length > 10);

    return [...new Set(updates)];
  }

  private buildEntitiesParagraph(
    text: string,
    assignedAgencies: string[],
    location: string,
  ) {
    const upper = text.toUpperCase();
    const agencies = [
      ...new Set([
        ...assignedAgencies,
        ...AGENCIES.filter((agency) => upper.includes(agency)),
      ]),
    ];
    const hospitals = HOSPITALS.filter((hospital) =>
      new RegExp(`\\b${hospital}\\b`).test(upper),
    );
    const casualtyParts = ['injured', 'deceased', 'evacuated']
      .map((label) => {
        const values = [
          ...text.matchAll(new RegExp(`${label}\\s*[=:]\\s*(\\d+)`, 'gi')),
        ].map((match) => Number(match[1]));
        return values.length ? `${Math.max(...values)} ${label}` : null;
      })
      .filter((value): value is string => Boolean(value));
    const resources = [
      ...text.matchAll(
        /\b(fire_engines|ambulances|rescue_teams|officers_deployed|patrol_cars|portable_pumps)\s*=\s*(\d+)\b/gi,
      ),
    ].map(
      (match) => `${match[2]} ${match[1].toLowerCase().replace(/_/g, ' ')}`,
    );

    const parts = [
      agencies.length
        ? `The responding organisations recorded were ${this.joinNatural(agencies)}`
        : null,
      `the incident location was ${location}`,
      hospitals.length
        ? `hospital references included ${this.joinNatural(hospitals)}`
        : null,
      casualtyParts.length
        ? `the highest recorded casualty figures were ${this.joinNatural(casualtyParts)}`
        : null,
      resources.length
        ? `recorded resources included ${this.joinNatural([...new Set(resources)])}`
        : null,
    ].filter((part): part is string => Boolean(part));

    return `${parts.join('; ')}.`;
  }

  private cleanLog(text: string) {
    return text.trim().replace(/\s+/g, ' ').replace(/\.+$/, '') + '.';
  }

  private humanize(value: string) {
    return value.toLowerCase().replace(/_/g, ' ');
  }

  private lowercaseFirst(value: string) {
    return value ? value[0].toLowerCase() + value.slice(1) : value;
  }

  private joinNatural(values: string[]) {
    if (values.length <= 1) {
      return values[0] ?? '';
    }
    return `${values.slice(0, -1).join(', ')} and ${values.at(-1)}`;
  }

  private countMatches(text: string, terms: string[]) {
    return terms.filter((term) => text.includes(term)).length;
  }

  private highestPriority(text: string) {
    const priorities = [...text.matchAll(/\bP([1-5])\b/gi)].map((match) =>
      Number(match[1]),
    );
    return priorities.length ? `P${Math.min(...priorities)}` : undefined;
  }

  private clamp(value: number, minimum: number, maximum: number) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  private toFinalAnalysisDto(incident: {
    id: string;
    inc_status: string;
    analysis_status: string;
    executive_summary: string | null;
    response_plan: string | null;
    entities: string | null;
    analysis_finalized_at: Date | null;
  }) {
    return {
      incidentId: incident.id,
      incidentStatus: incident.inc_status,
      analysisStatus: incident.analysis_status,
      executiveSummary: incident.executive_summary,
      responsePlan: incident.response_plan,
      entities: incident.entities,
      finalizedAt: incident.analysis_finalized_at,
    };
  }
}
