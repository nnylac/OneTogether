import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedIncidentTicket } from './incident-middleware.types';

@Injectable()
export class SemanticIncidentAnalyzerService {
  constructor(private readonly prisma: PrismaService) {}

  async findLikelyIncident(ticket: NormalizedIncidentTicket) {
    const exactIncident = await this.prisma.incidents.findUnique({
      where: {
        external_incident_id: ticket.externalIncidentId,
      },
    });

    if (exactIncident) {
      return {
        incident: exactIncident,
        reason: 'external_incident_match',
      };
    }

    const exactSource = await this.prisma.incident_sources.findUnique({
      where: {
        external_ticket_id: ticket.externalTicketId,
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

    const since = new Date(Date.now() - 30 * 60 * 1000);
    const recentCandidates = await this.prisma.incidents.findMany({
      where: {
        incident_type: ticket.incidentType,
        inc_status: {
          not: 'CLOSED',
        },
        created_at: {
          gte: since,
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
        this.overlap(descriptionTokens, candidateTokens) * 0.4 +
        (this.isNearby(ticket, candidate) ? 0.2 : 0);

      if (score >= 0.55) {
        return {
          incident: candidate,
          reason: 'rule_based_similarity',
        };
      }
    }

    return null;
  }

  private isNearby(
    ticket: NormalizedIncidentTicket,
    candidate: { latitude: unknown; longitude: unknown },
  ) {
    if (
      ticket.latitude === null ||
      ticket.longitude === null ||
      candidate.latitude === null ||
      candidate.longitude === null
    ) {
      return false;
    }

    const candidateLatitude = Number(candidate.latitude);
    const candidateLongitude = Number(candidate.longitude);
    if (
      !Number.isFinite(candidateLatitude) ||
      !Number.isFinite(candidateLongitude)
    ) {
      return false;
    }

    return (
      this.distanceMetres(
        ticket.latitude,
        ticket.longitude,
        candidateLatitude,
        candidateLongitude,
      ) < 500
    );
  }

  private distanceMetres(
    latitudeA: number,
    longitudeA: number,
    latitudeB: number,
    longitudeB: number,
  ) {
    const earthRadiusMetres = 6_371_000;
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const deltaLatitude = toRadians(latitudeB - latitudeA);
    const deltaLongitude = toRadians(longitudeB - longitudeA);
    const a =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(toRadians(latitudeA)) *
        Math.cos(toRadians(latitudeB)) *
        Math.sin(deltaLongitude / 2) ** 2;

    return 2 * earthRadiusMetres * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
