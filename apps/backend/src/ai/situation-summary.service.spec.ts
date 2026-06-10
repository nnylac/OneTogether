import { SituationSummaryService } from './situation-summary.service';
import { AiUnavailableError } from './ai.service';

const overview = {
  data: {
    totals: {
      totalIncidents: 10,
      activeIncidents: 4,
      criticalIncidents: 2,
    },
    incidentsByType: [],
    incidentsByRegion: [],
    severityDistribution: [],
  },
};

function buildService(completeJson: jest.Mock) {
  const prisma = {
    incidents: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const analytics = { findOverview: jest.fn().mockResolvedValue(overview) };
  const resources = {
    findSummary: jest.fn().mockResolvedValue({
      totals: { total: 100, available: 60 },
      criticalOutlets: [{ name: 'SGH', region: 'Central' }],
    }),
  };
  const alerts = {
    findAll: jest.fn().mockResolvedValue([
      { name: 'Open incidents', metric: 'openIncidents', status: 'Critical' },
      { name: 'Quiet rule', metric: 'floodReports', status: 'Normal' },
    ]),
  };
  return new SituationSummaryService(
    prisma as never,
    { completeJson } as never,
    analytics as never,
    resources as never,
    alerts as never,
  );
}

const sections = {
  overview: 'All quiet.',
  keyRisks: 'None.',
  resourcePosture: 'Healthy.',
  recommendedActions: 'Monitor.',
};

describe('SituationSummaryService', () => {
  it('returns AI sections and only passes triggered alert rules', async () => {
    const completeJson = jest.fn().mockResolvedValue(sections);
    const service = buildService(completeJson);

    const result = await service.getSituationSummary();

    expect(result.source).toBe('ai');
    expect(result.sections).toEqual(sections);
    const aggregate = JSON.parse(
      (completeJson.mock.calls[0][0] as { user: string }).user,
    ) as { triggeredAlertRules: Array<{ name: string }> };
    expect(aggregate.triggeredAlertRules).toHaveLength(1);
    expect(aggregate.triggeredAlertRules[0].name).toBe('Open incidents');
  });

  it('returns a deterministic fallback (HTTP 200 shape) when AI fails', async () => {
    const completeJson = jest
      .fn()
      .mockRejectedValue(new AiUnavailableError('down'));
    const service = buildService(completeJson);

    const result = await service.getSituationSummary();

    expect(result.source).toBe('fallback');
    expect(result.sections).toBeNull();
    expect(result.fallbackText).toContain('4 active incidents (2 critical)');
    expect(result.fallbackText).toContain('1 alert rule is triggered');
  });

  it('serves the cached payload within the TTL and bypasses on refresh', async () => {
    const completeJson = jest.fn().mockResolvedValue(sections);
    const service = buildService(completeJson);

    await service.getSituationSummary();
    await service.getSituationSummary();
    expect(completeJson).toHaveBeenCalledTimes(1);

    await service.getSituationSummary(true);
    expect(completeJson).toHaveBeenCalledTimes(2);
  });
});
