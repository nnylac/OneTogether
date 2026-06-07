import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedIncidentTicket } from './incident-middleware.types';

@Injectable()
export class SemanticIncidentAnalyzerService {
  constructor(private readonly prisma: PrismaService) {}

  async findLikelyIncident(ticket: NormalizedIncidentTicket) {
    const exactSource = await this.prisma.incident_sources.findFirst({
      where: {
        external_ticket_id: {
          in: [ticket.externalTicketId, ticket.externalIncidentId],
        },
      },
      include: {
        incidents: true,
      },
    });

    if (exactSource) {
      return {
        incident: exactSource.incidents,
        reason: 'external_source_match',
      };
    }

    const recentCandidates = await this.prisma.incidents.findMany({
      where: {
        incident_type: ticket.incidentType,
        inc_status: {
          not: 'CLOSED',
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
      take: 25,
    });

    const locationTokens = this.tokens(ticket.location ?? '');
    const descriptionTokens = this.tokens(ticket.description);

    for (const candidate of recentCandidates) {
      const candidateTokens = this.tokens(
        `${candidate.title} ${candidate.inc_description ?? ''} ${candidate.inc_location ?? ''}`,
      );
      const score =
        this.overlap(locationTokens, candidateTokens) * 0.6 +
        this.overlap(descriptionTokens, candidateTokens) * 0.4;

      if (score >= 0.55) {
        return {
          incident: candidate,
          reason: 'rule_based_similarity',
        };
      }
    }

    return null;
  }

  private tokens(value: string) {
    return new Set(
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length >= 3),
    );
  }

  private overlap(left: Set<string>, right: Set<string>) {
    if (!left.size || !right.size) {
      return 0;
    }

    let matches = 0;
    for (const token of left) {
      if (right.has(token)) {
        matches += 1;
      }
    }

    return matches / Math.max(left.size, right.size);
  }
}
