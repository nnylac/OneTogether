import { GoogleGenerativeAI } from '@google/generative-ai';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  }

  private getModel() {
    return this.genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL ?? 'gemini-2.5-flash' });
  }

  private retryDelay(err: unknown): number {
    const msg = err instanceof Error ? err.message : String(err);
    const match = msg.match(/"retryDelay":"(\d+)s"/);
    return match ? parseInt(match[1], 10) * 1000 : 3000;
  }

  private async ask(prompt: string): Promise<string> {
    const model = this.getModel();
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const is429 = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
        if (is429 && attempt < 2) {
          const wait = Math.min(this.retryDelay(err), 8000);
          this.logger.warn(`Gemini 429 — retrying in ${wait}ms (attempt ${attempt + 1}/3)`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Gemini failed after 3 attempts');
  }

  private parseJson<T>(text: string, fallback: T): T {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    try { return JSON.parse(cleaned) as T; } catch { return fallback; }
  }

  async generateSitrep(incident: Record<string, unknown>): Promise<Record<string, unknown>> {
    const timeline = (incident.timeline as { timestamp: string; organisation: string; category: string; text: string }[] ?? [])
      .slice(-4).map((e) => `[${e.timestamp}] ${e.organisation}: ${e.text}`).join('\n');

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
    incidentType: string; location: string; severity: string; description: string; audience: string;
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
      message: 'Emergency services are responding to an incident. Members of the public are advised to remain calm, follow all official instructions, and avoid the affected area.\n\nCall 995 (SCDF) for fire and medical emergencies. Call 999 for police assistance.\n\nFurther updates will be issued via this channel.',
    });
  }

  async suggestTaskAssignments(
    incidents: Record<string, unknown>[],
    orgs: Record<string, unknown>[],
  ): Promise<{ suggestions: { organisation: string; task: string; rationale: string; urgency: string }[] }> {
    const activeList = incidents
      .filter((i) => i.status !== 'Closed')
      .map((i) => `- [${i.severity}] ${i.title} @ ${i.location} | Status: ${i.status} | Assigned: ${(i.assignedOrganisations as string[]).join(', ') || 'UNASSIGNED'}`)
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

  async getCitizenGuidance(incidentType: string, description: string): Promise<{
    warning: string; dos: [string, string][]; donts: string[];
  }> {
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
      ],
      donts: [
        'Do NOT enter the affected area.',
        'Do NOT spread unverified information on social media.',
        'Do NOT obstruct emergency vehicles or personnel.',
      ],
    });
  }
}
