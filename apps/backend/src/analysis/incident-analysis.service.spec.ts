import { IncidentAnalysisService } from './incident-analysis.service';
import { AiUnavailableError } from '../ai/ai.service';

const disabledAi = { isEnabled: false } as never;

describe('IncidentAnalysisService', () => {
  it.each([
    ['TRAFFIC_ACCIDENT', 'traffic accident'],
    ['BUILDING_FIRE', 'fire'],
    ['FLOODING', 'flood'],
    ['MEDICAL_EMERGENCY', 'medical emergency'],
    ['GAS_LEAK', 'gas leak'],
    ['BUILDING_COLLAPSE', 'building collapse'],
    ['MISSING_PERSON', 'missing person'],
    ['DISEASE_OUTBREAK', 'disease outbreak'],
    ['HAZE', 'haze'],
    ['CIVIL_DISTURBANCE', 'civil disturbance'],
  ])('classifies authoritative incident type %s', (incidentType, category) => {
    const service = new IncidentAnalysisService({} as never, disabledAi);

    const result = service.classifyIncident(incidentType, 2);

    expect(result.category).toBe(category);
  });

  it.each([
    'Worker unconscious following suspected heat injury',
    'Resident reporting symptoms of a possible stroke',
    'Patient experiencing seizures in a public area',
    'Child suffering a serious allergic reaction',
    'Person experiencing severe breathing difficulty',
  ])('treats critical medical evidence as severity 5: %s', (description) => {
    const service = new IncidentAnalysisService({} as never, disabledAi);

    const result = service.classifyIncident(
      `MEDICAL_EMERGENCY ${description}`,
      2,
    );

    expect(result).toEqual(
      expect.objectContaining({
        category: 'medical emergency',
        urgency: 'critical',
        severity_estimate: 5,
      }),
    );
  });

  it('classifies explicit emergency evidence deterministically', () => {
    const service = new IncidentAnalysisService({} as never, disabledAi);

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
    const service = new IncidentAnalysisService(
      {
        incidents: {
          findUnique: jest.fn().mockResolvedValue(incident),
          update,
        },
      } as never,
      disabledAi,
    );

    const result = await service.generateFinalAnalysis('incident-1');

    expect(result.analysisStatus).toBe('COMPLETED');
    expect(result.generatedBy).toBe('rules');
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

  it('persists the AI report when the AI service succeeds', async () => {
    const incident = {
      id: 'incident-1',
      title: 'Building fire',
      incident_type: 'BUILDING_FIRE',
      severity: 4,
      inc_status: 'CLOSED',
      inc_location: 'Test Road',
      inc_description: null,
      category: 'fire',
      urgency: 'high',
      created_at: new Date('2026-06-09T00:00:00Z'),
      resolved_at: new Date('2026-06-09T02:00:00Z'),
      analysis_status: 'NOT_STARTED',
      analysis_finalized_at: null,
      logs: [],
      assigned_orgs: [],
      incident_sources: [],
    };
    const update = jest
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ ...incident, ...data }),
      );
    const completeJson = jest.fn().mockResolvedValue({
      executive_summary: 'AI summary.',
      response_plan: 'AI response plan.',
      entities: 'AI entities.',
    });
    const service = new IncidentAnalysisService(
      {
        incidents: {
          findUnique: jest.fn().mockResolvedValue(incident),
          update,
        },
      } as never,
      { isEnabled: true, completeJson } as never,
    );

    const result = await service.generateFinalAnalysis('incident-1');

    expect(result.generatedBy).toBe('ai');
    expect(result.executiveSummary).toBe('AI summary.');
    expect(completeJson).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          executive_summary: 'AI summary.',
          report: 'AI response plan.',
        }),
      }),
    );
  });

  it('falls back to the rule-based report when the AI service fails', async () => {
    const incident = {
      id: 'incident-1',
      title: 'Building fire',
      incident_type: 'BUILDING_FIRE',
      severity: 4,
      inc_status: 'CLOSED',
      inc_location: 'Test Road',
      inc_description: null,
      category: 'fire',
      urgency: 'high',
      created_at: new Date('2026-06-09T00:00:00Z'),
      resolved_at: null,
      analysis_status: 'NOT_STARTED',
      analysis_finalized_at: null,
      logs: [],
      assigned_orgs: [],
      incident_sources: [],
    };
    const update = jest
      .fn()
      .mockImplementation(({ data }) =>
        Promise.resolve({ ...incident, ...data }),
      );
    const completeJson = jest
      .fn()
      .mockRejectedValue(new AiUnavailableError('quota'));
    const service = new IncidentAnalysisService(
      {
        incidents: {
          findUnique: jest.fn().mockResolvedValue(incident),
          update,
        },
      } as never,
      { isEnabled: true, completeJson } as never,
    );

    const result = await service.generateFinalAnalysis('incident-1');

    expect(result.generatedBy).toBe('rules');
    expect(result.analysisStatus).toBe('COMPLETED');
    expect(result.executiveSummary).toContain('Building fire');
  });

  it('never calls the AI service when useAi is false', async () => {
    const incident = {
      id: 'incident-1',
      title: 'Building fire',
      incident_type: 'BUILDING_FIRE',
      severity: 4,
      inc_status: 'CLOSED',
      inc_location: 'Test Road',
      analysis_status: 'NOT_STARTED',
      analysis_finalized_at: null,
      logs: [],
      assigned_orgs: [],
      incident_sources: [],
    };
    const completeJson = jest.fn();
    const service = new IncidentAnalysisService(
      {
        incidents: {
          findUnique: jest.fn().mockResolvedValue(incident),
          update: jest
            .fn()
            .mockImplementation(({ data }) =>
              Promise.resolve({ ...incident, ...data }),
            ),
        },
      } as never,
      { isEnabled: true, completeJson } as never,
    );

    const result = await service.generateFinalAnalysis('incident-1', true, {
      useAi: false,
    });

    expect(result.generatedBy).toBe('rules');
    expect(completeJson).not.toHaveBeenCalled();
  });

  it('updates analysis fields from the complete incident timeline', async () => {
    const update = jest.fn().mockResolvedValue({});
    const service = new IncidentAnalysisService(
      {
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
      } as never,
      disabledAi,
    );

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
