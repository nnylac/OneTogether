import { Injectable, Logger } from '@nestjs/common';
import type { Incident } from './types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  private get apiKey(): string {
    return process.env.GEMINI_API_KEY ?? '';
  }

  private get model(): string {
    return process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  }

  async ask(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    this.logger.log(`Gemini request → model=${this.model} key=${this.apiKey ? this.apiKey.slice(0, 6) + '…' : 'MISSING'}`);

    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (res.status === 429 && attempt < 2) {
        const wait = 3000 * (attempt + 1);
        this.logger.warn(`Gemini 429 — retrying in ${wait}ms (attempt ${attempt + 1}/3)`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Gemini ${res.status} — ${body}`);
        throw new Error(`Gemini ${res.status}: ${body}`);
      }

      const data = await res.json() as { candidates: { content: { parts: { text: string }[] } }[] };
      const reply = data.candidates[0].content.parts[0].text;
      this.logger.log(`Gemini OK — ${reply.length} chars returned`);
      return reply;
    }

    throw new Error('Gemini failed after 3 attempts');
  }

  parseJson<T>(text: string, fallback: T): T {
    const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    try {
      return JSON.parse(cleaned) as T;
    } catch {
      return fallback;
    }
  }

  async generateAdvisory(incident: Incident): Promise<{
    generatedAt: string;
    assessment: string;
    recommendations: { priority: string; action: string; detail: string }[];
    warnings: string[];
  }> {
    const timeline = (incident.timeline ?? [])
      .slice(-5)
      .map((e) => `[${e.timestamp}] ${e.organisation}: ${e.text}`)
      .join('\n');

    const text = await this.ask(`You are a Singapore national emergency operations advisor.

Analyse this active incident and give concrete, prioritised recommendations on how to handle and resolve it.

Incident: ${incident.title}
Type: ${incident.type} | Severity: ${incident.severity} | Status: ${incident.status}
Location: ${incident.location}
Summary: ${String(incident.description).slice(0, 300)}
Resources: ${incident.unitsResponded} units, ${incident.volunteersResponded} volunteers
Assigned agencies: ${incident.assignedOrganisations.join(', ') || 'none'}
Recent timeline:
${timeline || 'none'}

Give 3-5 actionable recommendations in priority order. Each must be specific to this incident, not generic.
Also flag 2-3 operational risks or watch-outs commanders should be aware of.

Reply ONLY valid JSON, no markdown fences:
{"assessment":"2 sentence situational assessment","recommendations":[{"priority":"Critical|High|Medium","action":"short action title","detail":"what to do and why, 1-2 sentences"}],"warnings":["specific risk or watch-out"]}`);

    const fallback = {
      assessment: `${incident.type} incident at ${incident.location} is currently ${incident.status}. Immediate coordination required across assigned agencies.`,
      recommendations: [
        { priority: 'High', action: 'Confirm resource sufficiency', detail: 'Verify current units are adequate for the incident scale and request reinforcements if needed.' },
        { priority: 'High', action: 'Establish clear command', detail: 'Ensure an incident commander is designated and all agencies are operating under unified command.' },
        { priority: 'Medium', action: 'Issue public advisory', detail: 'Communicate safety instructions to affected public via official channels.' },
      ],
      warnings: [
        'Monitor for incident escalation and adjust resource deployment accordingly.',
        'Ensure inter-agency communications are functioning on all channels.',
      ],
    };

    const parsed = this.parseJson<typeof fallback>(text, fallback);
    return { ...parsed, generatedAt: new Date().toLocaleString('en-SG') };
  }

  async generateSitrep(incident: Incident): Promise<Record<string, unknown>> {
    const timeline = (incident.timeline ?? [])
      .slice(-4)
      .map((e) => `[${e.timestamp}] ${e.organisation}: ${e.text}`)
      .join('\n');

    const text = await this.ask(`Singapore emergency SITREP writer. Write a situation report.

${incident.id} — ${incident.title} | ${incident.type} | ${incident.severity} | ${incident.status}
Location: ${incident.location}
Summary: ${String(incident.description).slice(0, 200)}
Units: ${incident.unitsResponded} | Volunteers: ${incident.volunteersResponded}
Recent log: ${timeline || 'none'}

Reply ONLY valid JSON, no fences:
{"situation":"2-3 sentences","currentActions":["a","b","c"],"nextActions":["a","b","c"],"resourceStatus":"1 sentence","casualties":"note or null"}`);

    const parsed = this.parseJson<Record<string, unknown>>(text, {});
    return { ...parsed, generatedAt: new Date().toLocaleString('en-SG') };
  }

  async generateBroadcastDraft(ctx: {
    incidentType: string;
    location: string;
    severity: string;
    description: string;
    audience: string;
  }): Promise<{ title: string; message: string }> {
    const text = await this.ask(`You are an official emergency communications officer for Singapore's OneTogether platform.

Write an official emergency broadcast for the public.

Incident type: ${ctx.incidentType}
Location: ${ctx.location}
Severity: ${ctx.severity}
Audience: ${ctx.audience}
Situation: ${ctx.description}

Requirements:
- Calm and authoritative tone — do not cause panic
- Tell the public what happened, what they should do, and who to call
- Reference SCDF emergency line 995, Police 999 where relevant
- Title: under 10 words
- Message: 3 short paragraphs

Reply with ONLY valid JSON, no markdown fences:
{"title":"short broadcast title","message":"paragraph 1\\n\\nparagraph 2\\n\\nparagraph 3"}`);

    return this.parseJson(text, {
      title: 'Emergency Advisory — Please Follow Official Instructions',
      message:
        'Emergency services are responding to an incident. Members of the public are advised to remain calm, follow all official instructions, and avoid the affected area.\n\nCall 995 (SCDF) for fire and medical emergencies. Call 999 for police assistance.\n\nFurther updates will be issued via this channel.',
    });
  }

  async suggestTaskAssignments(
    incidents: Incident[],
    orgs: { name: string; type: string; volunteersAvailable: number; volunteersTotal: number; activeTasks: number }[],
  ): Promise<{ suggestions: { organisation: string; task: string; rationale: string; urgency: string }[] }> {
    const activeList = incidents
      .filter((i) => i.status !== 'Closed')
      .map(
        (i) =>
          `- [${i.severity}] ${i.title} @ ${i.location} | Status: ${i.status} | Assigned: ${i.assignedOrganisations.join(', ') || 'UNASSIGNED'}`,
      )
      .join('\n');

    const orgList = orgs
      .map((o) => `- ${o.name} (${o.type}): ${o.volunteersAvailable}/${o.volunteersTotal} volunteers available, ${o.activeTasks} active tasks`)
      .join('\n');

    const text = await this.ask(`You are a national emergency operations AI advisor for Singapore's government emergency coordination platform.

Analyse the current incident landscape and available organisations. Suggest 3 to 5 specific task assignments that address gaps or under-resourced responses.

ACTIVE INCIDENTS:
${activeList}

AVAILABLE ORGANISATIONS:
${orgList}

For each suggestion: identify a specific need, name the best-fit organisation, give a concrete task title, and explain your reasoning in 1-2 sentences.

Reply with ONLY valid JSON, no markdown fences:
{"suggestions":[{"organisation":"full org name","task":"specific task title under 12 words","rationale":"why this org for this task in 1-2 sentences","urgency":"Critical or High or Medium"}]}`);

    return this.parseJson(text, { suggestions: [] });
  }

  async getCitizenGuidance(
    incidentType: string,
    description: string,
  ): Promise<{ warning: string; dos: [string, string][]; donts: string[] }> {
    const text = await this.ask(`You are a Singapore public safety advisor on the OneTogether emergency platform.

Write clear safety guidance for a member of the public facing this emergency situation.

Incident type: ${incidentType}
Situation: ${description}

Reply with ONLY valid JSON, no markdown fences:
{"warning":"1 urgent sentence — what the person needs to know right now","dos":[["action title","brief practical detail"],["action title","brief practical detail"],["action title","brief practical detail"]],"donts":["thing to avoid","thing to avoid","thing to avoid"]}`);

    return this.parseJson(text, {
      warning: 'Follow all official instructions and stay away from the affected area.',
      dos: [
        ['Call 995 for life-threatening emergencies', 'If you or someone is in immediate danger, call SCDF at 995 immediately.'],
        ['Follow official instructions', 'Listen to emergency responders and official announcements.'],
        ['Avoid the affected area', 'Do not approach the incident scene — leave access clear for emergency services.'],
      ] as [string, string][],
      donts: [
        'Do NOT enter the affected area.',
        'Do NOT spread unverified information on social media.',
        'Do NOT obstruct emergency vehicles or personnel.',
      ],
    });
  }
}
