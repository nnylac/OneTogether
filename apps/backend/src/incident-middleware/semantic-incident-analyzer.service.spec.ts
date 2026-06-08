import { SemanticIncidentAnalyzerService } from './semantic-incident-analyzer.service';
import type { NormalizedIncidentTicket } from './incident-middleware.types';

describe('SemanticIncidentAnalyzerService', () => {
  const ticket: NormalizedIncidentTicket = {
    agencyId: 'SPF',
    orgId: 'SPF',
    systemId: 'POLARIS',
    externalIncidentId: 'incident-123',
    externalTicketId: 'SPF-123',
    status: 'OPEN',
    title: 'SPF - TRAFFIC_ACCIDENT - Test Road',
    description: 'Vehicle collision',
    incidentType: 'TRAFFIC_ACCIDENT',
    severity: 3,
    priority: 'P2',
    location: 'Test Road, Central',
    latitude: 1.3,
    longitude: 103.8,
    confidenceScore: 85,
    rawMessage: {},
  };

  it('prefers the canonical external incident identity', async () => {
    const incident = { id: 'canonical' };
    const prisma = {
      incidents: {
        findUnique: jest.fn().mockResolvedValue(incident),
      },
      incident_sources: {
        findUnique: jest.fn(),
      },
    };
    const service = new SemanticIncidentAnalyzerService(prisma as never);

    await expect(service.findLikelyIncident(ticket)).resolves.toEqual({
      incident,
      reason: 'external_incident_match',
    });
    expect(prisma.incident_sources.findUnique).not.toHaveBeenCalled();
  });

  it('limits fuzzy candidates to the recent time window', async () => {
    const prisma = {
      incidents: {
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      incident_sources: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    const service = new SemanticIncidentAnalyzerService(prisma as never);

    await service.findLikelyIncident(ticket);

    expect(prisma.incidents.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          created_at: { gte: expect.any(Date) },
        }),
      }),
    );
  });
});
