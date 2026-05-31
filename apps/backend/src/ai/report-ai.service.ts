import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from './ai.service';

@Injectable()
export class ReportAiService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {}

  async generateReport(
    incidentId: string,
    mode: 'generate' | 'improve' | 'rephrase',
    currentContent: string,
  ): Promise<{ html: string }> {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        timeline: { orderBy: { timestamp: 'asc' }, take: 30 },
        messages: { where: { isAi: false }, orderBy: { createdAt: 'asc' }, take: 50 },
        resources: { include: { unit: true } },
        uploads: true,
      },
    });

    if (!incident) throw new NotFoundException('Incident not found');

    const timelineText = incident.timeline
      .map((e) => `[${new Date(e.timestamp).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}] [${e.category}] ${e.organisation ?? ''}: ${e.text}`)
      .join('\n');

    const chatText = incident.messages
      .map((m) => `${m.senderName}${m.senderRole ? ` (${m.senderRole})` : ''}: ${m.content}`)
      .join('\n');

    const resourcesText = incident.resources.length > 0
      ? incident.resources.map((r) => `- ${r.unit?.callSign ?? r.unitId} (${r.unit?.type ?? 'Unit'}) -- ${r.status}`).join('\n')
      : 'No resources assigned.';

    const uploadsText = incident.uploads.length > 0
      ? incident.uploads.map((u) => `- ${u.originalName} (${u.mimeType})${u.caption ? ': ' + u.caption : ''}`).join('\n')
      : 'No evidence attached.';

    const modeInstruction: Record<string, string> = {
      generate: 'Write a complete, professional incident report from scratch using all provided context.',
      improve: 'Improve the existing report content for clarity, completeness, and professionalism. Expand sections that lack detail.',
      rephrase: 'Rephrase and restructure the existing report content for professional readability. Preserve all factual information.',
    };

    const prompt = `You are a Singapore national emergency operations officer writing an official incident report.

${modeInstruction[mode]}

=== INCIDENT DETAILS ===
Title: ${incident.title}
Type: ${incident.type} | Severity: ${incident.severity} | Status: ${incident.status}
Location: ${incident.location}${incident.zone ? ` (Zone: ${incident.zone})` : ''}
${incident.incidentCommander ? `Incident Commander: ${incident.incidentCommander}` : ''}
${incident.confidenceScore != null ? `Confidence Score: ${incident.confidenceScore}%` : ''}
Description: ${incident.description ?? 'Not provided'}

=== INCIDENT TIMELINE ===
${timelineText || 'No timeline events recorded.'}

=== OPERATIONAL COMMUNICATIONS ===
${chatText || 'No communications recorded.'}

=== DEPLOYED RESOURCES ===
${resourcesText}

=== ATTACHED EVIDENCE ===
${uploadsText}

${['improve', 'rephrase'].includes(mode) && currentContent ? `=== CURRENT REPORT CONTENT ===\n${currentContent}\n` : ''}

=== OUTPUT REQUIREMENTS ===
Return ONLY valid HTML using: <h1> <h2> <h3> <p> <ul> <ol> <li> <strong> <em> <blockquote> <hr>
Do NOT include <html> <body> <head> <style> tags or markdown code fences.
Use <h1> for the main report title, <h2> for major sections, <h3> for sub-sections.

Required sections: Executive Summary, Incident Overview, Timeline of Events, Resources Deployed, Actions Taken, Current Status, Recommendations.

Write in third person. Completed actions in past tense. Current status in present tense.
Be factual, concise, and professional. Suitable for official Singapore government records.`;

    const raw = await this.ai.ask(prompt);
    const html = raw.replace(/^```(?:html)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
    return { html };
  }
}
