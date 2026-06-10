import { IncidentMiddlewareService } from './incident-middleware.service';
import type { NormalizedIncidentTicket } from './incident-middleware.types';

describe('IncidentMiddlewareService canonical identity', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads and updates the winning incident after a concurrent unique conflict', async () => {
    const winner = {
      id: 'incident-db-id',
      code: 'EXT1234567',
      external_incident_id: 'shared-incident',
      title: 'Existing incident',
      incident_type: 'BUILDING_FIRE',
      severity: 2,
      inc_status: 'ACTIVE',
      inc_description: null,
      inc_location: null,
      latitude: null,
      longitude: null,
      report: null,
      created_at: new Date(),
      updated_at: new Date(),
      resolved_at: null,
      confidence_score: 70,
      category: null,
      urgency: null,
      severity_estimate: null,
      confidence: null,
      analysis_status: 'NOT_STARTED',
      executive_summary: null,
      response_plan: null,
      entities: null,
      analysis_finalized_at: null,
    };
    const create = jest.fn().mockRejectedValue({ code: 'P2002' });
    const update = jest.fn().mockResolvedValue({
      ...winner,
      severity: 5,
      confidence_score: 90,
    });
    const prisma = {
      incidents: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.external_incident_id) {
            return Promise.resolve(winner);
          }
          return Promise.resolve(null);
        }),
        create,
        update,
      },
    };
    const service = new IncidentMiddlewareService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );
    const normalized: NormalizedIncidentTicket = {
      agencyId: 'SCDF',
      orgId: 'SCDF',
      systemId: 'FIREWATCH',
      externalIncidentId: 'shared-incident',
      externalTicketId: 'SCDF-123',
      status: 'IN_PROGRESS',
      title: 'Building fire',
      description: 'Visible flames',
      incidentType: 'BUILDING_FIRE',
      severity: 5,
      priority: 'P1',
      location: 'Test Road',
      latitude: 1.3,
      longitude: 103.8,
      confidenceScore: 90,
      rawMessage: {},
    };

    const result = await (
      service as unknown as {
        createOrLoadCanonicalIncident(
          ticket: NormalizedIncidentTicket,
        ): Promise<{ incident: typeof winner; created: boolean }>;
      }
    ).createOrLoadCanonicalIncident(normalized);

    expect(create).toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: winner.id },
        data: expect.objectContaining({
          severity: 5,
          confidence_score: 90,
        }),
      }),
    );
    expect(result.created).toBe(false);
    expect(result.incident.severity).toBe(5);
  });

  it('keeps the detailed canonical stage until every assignment completes', async () => {
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      assigned_orgs: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ status: 'COMPLETED' }, { status: 'ON SCENE' }]),
      },
      incidents: {
        findUnique: jest.fn().mockResolvedValue({ inc_status: 'STABILISING' }),
        update,
      },
    };
    const service = new IncidentMiddlewareService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const status = await (
      service as unknown as {
        reconcileCanonicalStatus(
          id: string,
          sourceStatus: string,
        ): Promise<string>;
      }
    ).reconcileCanonicalStatus('incident-db-id', 'ON_SCENE');

    expect(status).toBe('STABILISING');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'incident-db-id' },
      data: { inc_status: 'STABILISING', resolved_at: null },
    });
  });

  it('closes the canonical incident when every assignment completes', async () => {
    const update = jest.fn().mockResolvedValue({});
    const prisma = {
      assigned_orgs: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { status: 'COMPLETED' },
            { status: 'COMPLETED' },
          ]),
      },
      incidents: {
        findUnique: jest.fn().mockResolvedValue({ inc_status: 'MONITORING' }),
        update,
      },
    };
    const service = new IncidentMiddlewareService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
    );

    const status = await (
      service as unknown as {
        reconcileCanonicalStatus(
          id: string,
          sourceStatus: string,
        ): Promise<string>;
      }
    ).reconcileCanonicalStatus('incident-db-id', 'CLOSED');

    expect(status).toBe('CLOSED');
    expect(update).toHaveBeenCalledWith({
      where: { id: 'incident-db-id' },
      data: {
        inc_status: 'CLOSED',
        resolved_at: expect.any(Date),
      },
    });
  });

  it('applies classification severity and confidence to the incident', async () => {
    const analyzeIncidentTimeline = jest.fn().mockResolvedValue({
      category: 'fire',
      urgency: 'critical',
      severity_estimate: 5,
      confidence: 0.91,
    });
    const service = new IncidentMiddlewareService(
      {} as never,
      {} as never,
      {} as never,
      { analyzeIncidentTimeline } as never,
    );

    await (
      service as unknown as {
        applyAutomatedAnalysis(id: string): Promise<void>;
      }
    ).applyAutomatedAnalysis('incident-db-id');

    expect(analyzeIncidentTimeline).toHaveBeenCalledWith('incident-db-id');
  });

  it('preserves the original assignment timestamp on agency updates', async () => {
    const upsert = jest.fn().mockResolvedValue({});
    const prisma = {
      organisations: {
        upsert: jest.fn().mockResolvedValue({
          id: 'organisation-id',
          org_name: 'SCDF',
        }),
      },
      assigned_orgs: { upsert },
    };
    const service = new IncidentMiddlewareService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await (
      service as unknown as {
        assignOrganisation(
          incidentId: string,
          orgName: string,
          status: string,
          incidentTitle: string,
        ): Promise<void>;
      }
    ).assignOrganisation(
      'incident-db-id',
      'SCDF',
      'IN_PROGRESS',
      'Building fire',
    );

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: {
          status: 'ON SCENE',
        },
      }),
    );
    expect(upsert.mock.calls[0][0].update).not.toHaveProperty('assigned_at');
  });

  it('stores the originating agency on readable logs', async () => {
    const create = jest.fn().mockResolvedValue({});
    const service = new IncidentMiddlewareService(
      { logs: { create } } as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await (
      service as unknown as {
        createLog(
          incidentId: string,
          agencyId: string,
          status: string,
          reason: string,
          ticket: NormalizedIncidentTicket,
          message: NormalizedIncidentTicket['rawMessage'],
        ): Promise<void>;
      }
    ).createLog(
      'incident-db-id',
      'SPF',
      'OPEN',
      'new_incident',
      {
        agencyId: 'SPF',
        orgId: 'SPF',
        systemId: 'POLARIS',
        externalIncidentId: 'shared-incident',
        externalTicketId: 'SPF-123',
        status: 'OPEN',
        title: 'Traffic accident',
        description: 'Collision reported',
        incidentType: 'TRAFFIC_ACCIDENT',
        severity: 3,
        priority: 'P2',
        location: 'Test Road',
        latitude: 1.3,
        longitude: 103.8,
        confidenceScore: 85,
        rawMessage: {},
      },
      {},
    );

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        incident_id: 'incident-db-id',
        agency_id: 'SPF',
      }),
    });
  });
});
