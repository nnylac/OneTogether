import { BadRequestException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('aggregates incident and multi-agency organisation metrics', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        id: 'incident-1',
        incident_type: 'MEDICAL_EMERGENCY',
        severity: 5,
        inc_status: 'CLOSED',
        inc_location: 'Orchard MRT',
        latitude: null,
        longitude: null,
        created_at: new Date('2026-06-01T00:00:00.000Z'),
        resolved_at: new Date('2026-06-01T01:00:00.000Z'),
        assigned_orgs: [
          {
            status: 'COMPLETED',
            organisations: { id: 'scdf-id', org_name: 'SCDF' },
          },
          {
            status: 'COMPLETED',
            organisations: { id: 'spf-id', org_name: 'SPF' },
          },
        ],
        logs: [
          {
            agency_id: 'SCDF',
            content: 'SCDF update. Status: RECEIVED.',
            created_at: new Date('2026-06-01T00:01:00.000Z'),
          },
          {
            agency_id: 'SPF',
            content: 'SPF update. Status: DISPATCHED.',
            created_at: new Date('2026-06-01T00:02:00.000Z'),
          },
          {
            agency_id: 'SCDF',
            content: 'SCDF update. Status: DISPATCHED.',
            created_at: new Date('2026-06-01T00:03:00.000Z'),
          },
        ],
      },
      {
        id: 'incident-2',
        incident_type: 'FLOODING',
        severity: 3,
        inc_status: 'RESPONDING',
        inc_location: 'Jurong West',
        latitude: null,
        longitude: null,
        created_at: new Date('2026-06-02T00:00:00.000Z'),
        resolved_at: null,
        assigned_orgs: [
          {
            status: 'ON SCENE',
            organisations: { id: 'pub-id', org_name: 'PUB' },
          },
        ],
        logs: [
          {
            agency_id: 'PUB',
            content: 'PUB update. Status: ON_SCENE.',
            created_at: new Date('2026-06-02T00:04:00.000Z'),
          },
        ],
      },
    ]);
    const service = new AnalyticsService({
      incidents: { findMany },
    } as never);

    const result = await service.findOverview({
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-06-03T00:00:00.000Z',
    });

    expect(result.data.totals).toEqual(
      expect.objectContaining({
        totalIncidents: 2,
        activeIncidents: 1,
        closedIncidents: 1,
        criticalIncidents: 1,
        criticalIncidentRate: 0.5,
        averageSeverity: 4,
        multiAgencyRate: 0.5,
      }),
    );
    expect(result.data.totals.resolutionTimeMinutes).toEqual({
      average: 60,
      median: 60,
      p90: 60,
      quality: 'direct',
    });
    expect(result.data.incidentsByRegion).toEqual(
      expect.arrayContaining([
        { region: 'Central', count: 1 },
        { region: 'West', count: 1 },
      ]),
    );
    expect(result.data.organisations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          organisationName: 'SCDF',
          incidentsHandled: 1,
          completionRate: 1,
          averageFirstUpdateMinutes: 1,
          averageFirstActiveResponseMinutes: 3,
          timingQuality: 'inferred',
        }),
        expect.objectContaining({
          organisationName: 'SPF',
          averageFirstUpdateMinutes: 2,
          averageFirstActiveResponseMinutes: 2,
        }),
        expect.objectContaining({
          organisationName: 'PUB',
          activeWorkload: 1,
          completionRate: 0,
          averageFirstActiveResponseMinutes: 4,
        }),
      ]),
    );
  });

  it('returns stable empty analytics', async () => {
    const service = new AnalyticsService({
      incidents: { findMany: jest.fn().mockResolvedValue([]) },
    } as never);

    const result = await service.findOverview({
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-06-02T00:00:00.000Z',
    });

    expect(result.data.totals.totalIncidents).toBe(0);
    expect(result.data.totals.criticalIncidentRate).toBe(0);
    expect(result.data.totals.resolutionTimeMinutes.average).toBeNull();
    expect(result.data.severityDistribution).toHaveLength(5);
    expect(result.data.organisations).toEqual([]);
  });

  it('rejects an invalid region', async () => {
    const service = new AnalyticsService({} as never);

    await expect(
      service.findOverview({ region: 'South' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
