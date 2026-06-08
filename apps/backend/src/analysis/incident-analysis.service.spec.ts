import { IncidentAnalysisService } from './incident-analysis.service';

describe('IncidentAnalysisService', () => {
  it('classifies explicit emergency evidence deterministically', () => {
    const service = new IncidentAnalysisService({} as never);

    const result = service.classifyIncident(
      'Building fire with visible flames. Two fire engines deployed. Residents evacuated.',
      3,
      'P1',
    );

    expect(result).toEqual(
      expect.objectContaining({
        category: 'fire',
        urgency: 'high',
        severity_estimate: 4,
      }),
    );
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('persists a generated final report for a closed incident', async () => {
    const incident = {
      id: 'incident-1',
      title: 'Building fire',
      incident_type: 'BUILDING_FIRE',
      severity: 4,
      inc_status: 'CLOSED',
      inc_location: 'Test Road',
      analysis_status: 'NOT_STARTED',
      analysis_finalized_at: null,
      logs: [
        {
          created_at: new Date('2026-06-09T01:00:00Z'),
          content:
            'SCDF created a new incident. Update: Fire engines deployed. Evidence: resources fire_engines=2.',
        },
        {
          created_at: new Date('2026-06-09T01:10:00Z'),
          content: 'SCDF linked an update. Update: Fire contained.',
        },
      ],
      assigned_orgs: [
        {
          assigned_at: new Date(),
          organisations: { org_name: 'SCDF' },
        },
      ],
      incident_sources: [
        {
          last_synced_at: new Date(),
          external_ticket_id: 'SCDF-1',
        },
      ],
    };
    const update = jest.fn().mockImplementation(({ data }) =>
      Promise.resolve({
        ...incident,
        ...data,
      }),
    );
    const service = new IncidentAnalysisService({
      incidents: {
        findUnique: jest.fn().mockResolvedValue(incident),
        update,
      },
    } as never);

    const result = await service.generateFinalAnalysis('incident-1');

    expect(result.analysisStatus).toBe('COMPLETED');
    expect(result.executiveSummary).toContain('Building fire');
    expect(result.responsePlan).toContain('fire engines deployed');
    expect(result.entities).toContain('SCDF');
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          analysis_status: 'COMPLETED',
          report: expect.any(String),
        }),
      }),
    );
  });

  it('updates analysis fields from the complete incident timeline', async () => {
    const update = jest.fn().mockResolvedValue({});
    const service = new IncidentAnalysisService({
      incidents: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'incident-1',
          title: 'Emergency response',
          inc_description: 'Patient unresponsive',
          inc_location: 'Test Road',
          severity: 2,
          logs: [
            {
              created_at: new Date(),
              content:
                'SCDF update. Priority: P1. Update: CPR administered. Patient stabilised.',
            },
          ],
        }),
        update,
      },
    } as never);

    const result = await service.analyzeIncidentTimeline('incident-1');

    expect(result).toEqual(
      expect.objectContaining({
        category: 'medical emergency',
        urgency: 'critical',
        severity_estimate: 5,
      }),
    );
    expect(update).toHaveBeenCalledWith({
      where: { id: 'incident-1' },
      data: expect.objectContaining({
        category: 'medical emergency',
        urgency: 'critical',
        severity_estimate: 5,
        severity: 5,
      }),
    });
  });
});
