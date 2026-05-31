import { Injectable, Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

type AiCommand = 'generate-report' | 'summarize' | 'suggest-next-steps' | 'resource-status' | 'freeform';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private ai: AiService,
    private prisma: PrismaService,
  ) {}

  detectCommand(content: string): AiCommand {
    const lower = content.toLowerCase();
    if (lower.includes('/generate-report')) return 'generate-report';
    if (lower.includes('/summarize')) return 'summarize';
    if (lower.includes('/suggest-next-steps')) return 'suggest-next-steps';
    if (lower.includes('/resource-status')) return 'resource-status';
    return 'freeform';
  }

  checkRateLimit(incidentId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(incidentId);
    if (!entry || entry.resetAt < now) {
      this.rateLimitMap.set(incidentId, { count: 1, resetAt: now + 60_000 });
      return true;
    }
    if (entry.count >= 10) return false;
    entry.count++;
    return true;
  }

  async buildContext(incidentId: string) {
    const [incident, messages, timeline, resources] = await Promise.all([
      this.prisma.incident.findUnique({ where: { id: incidentId } }),
      this.prisma.chatMessage.findMany({
        where: { incidentId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.timelineEvent.findMany({
        where: { incidentId },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
      this.prisma.resourceAssignment.findMany({
        where: { incidentId },
        include: { unit: true },
      }),
    ]);

    return { incident, messages: messages.reverse(), timeline: timeline.reverse(), resources };
  }

  async handleMention(incidentId: string, content: string): Promise<string> {
    if (!this.checkRateLimit(incidentId)) {
      return 'AI rate limit reached for this incident room. Please wait before sending another AI request.';
    }

    const command = this.detectCommand(content);
    const ctx = await this.buildContext(incidentId);
    if (!ctx.incident) return 'Incident not found.';

    const { incident, messages, timeline, resources } = ctx;

    const chatHistory = messages
      .map((m) => `[${m.senderName}${m.isAi ? ' (AI)' : ''}]: ${m.content}`)
      .join('\n');

    const timelineStr = timeline
      .map((t) => `[${t.organisation ?? 'System'}] ${t.category}: ${t.text}`)
      .join('\n');

    const resourceStr = resources
      .map((r) => `${r.unit.callSign} (${r.unit.type}) — ${r.status}`)
      .join('\n') || 'No units assigned.';

    const baseCtx = `
INCIDENT: ${incident.title}
ID: ${incident.id}
Type: ${incident.type} | Severity: ${incident.severity} | Status: ${incident.status}
Location: ${incident.location}${incident.zone ? ` (${incident.zone})` : ''}
Description: ${incident.description}

ASSIGNED RESOURCES:
${resourceStr}

RECENT TIMELINE (last 10):
${timelineStr || 'No timeline entries.'}

RECENT CHAT (last 20 messages):
${chatHistory || 'No messages yet.'}
`.trim();

    try {
      return await this.callGeminiForCommand(command, baseCtx, content);
    } catch (err) {
      this.logger.error('AI chat error', err);
      return 'AI is temporarily unavailable. Please try again shortly.';
    }
  }

  private async callGeminiForCommand(command: AiCommand, ctx: string, rawContent: string): Promise<string> {
    switch (command) {
      case 'generate-report':
        return this.ai.ask(`You are a Singapore emergency operations SITREP writer.
Generate a formal Situation Report for the incident below.

${ctx}

Format your response as:
**SITUATION REPORT**
**Incident:** [title]
**Time:** [current time estimate]
**Status:** [current status]

**SITUATION SUMMARY**
[2-3 sentences]

**CURRENT ACTIONS**
- [action 1]
- [action 2]
- [action 3]

**NEXT ACTIONS**
- [action 1]
- [action 2]

**RESOURCE STATUS**
[1-2 sentences]

**CASUALTIES/IMPACT**
[note or "None reported"]`);

      case 'summarize':
        return this.ai.ask(`You are a Singapore emergency operations advisor.
Summarise the current state of this incident in 4-6 concise bullet points for a duty officer being briefed quickly.

${ctx}

Start with the most critical facts. Be direct and operational.`);

      case 'suggest-next-steps':
        return this.ai.ask(`You are a Singapore emergency operations advisor.
Based on the incident below, provide 4-6 prioritised next actions for responders on the ground.

${ctx}

Format as numbered list with priority labels (CRITICAL / HIGH / MEDIUM). Be specific to this incident type and current status.`);

      case 'resource-status':
        return this.ai.ask(`You are a Singapore emergency operations resource coordinator.
Analyse the resource deployment for this incident and provide:
1. Current resource status summary
2. Any gaps or under-resourcing
3. Recommendations for additional units if needed

${ctx}

Be specific. Reference unit call signs where relevant.`);

      default: {
        // freeform - strip @ai prefix
        const question = rawContent.replace(/@ai\s*/i, '').trim();
        return this.ai.ask(`You are an AI assistant embedded in Singapore's OneTogether emergency response platform.
A responder on an active incident has asked you a question.

${ctx}

RESPONDER QUESTION: ${question}

Answer concisely and operationally. Reference specific incident details where relevant.`);
      }
    }
  }
}
