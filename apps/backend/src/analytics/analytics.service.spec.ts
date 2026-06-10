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

  it('forecasts simulated incident volume and distributions', async () => {
    const findMany = jest.fn().mockResolvedValue([
      {
        incident_type: 'TRAFFIC_ACCIDENT',
        inc_location: 'Jurong West',
        latitude: null,
        longitude: null,
        created_at: new Date('2026-06-07T00:00:00.000Z'),
      },
      {
        incident_type: 'TRAFFIC_ACCIDENT',
        inc_location: 'Jurong East',
        latitude: null,
        longitude: null,
        created_at: new Date('2026-06-08T00:00:00.000Z'),
      },
      {
        incident_type: 'BUILDING_FIRE',
        inc_location: 'Bedok',
        latitude: null,
        longitude: null,
        created_at: new Date('2026-06-09T00:00:00.000Z'),
      },
    ]);
    const service = new AnalyticsService({
      incidents: { findMany },
    } as never);

    const result = await service.findForecast({
      from: '2026-06-03T00:00:00.000Z',
      to: '2026-06-10T00:00:00.000Z',
      days: '7',
    });

    expect(result.forecast).toEqual(
      expect.objectContaining({
        horizonDays: 7,
        sampleSize: 3,
        historyDays: 7,
        confidence: 'very_low',
        topIncidentType: 'TRAFFIC_ACCIDENT',
        topRegion: 'West',
      }),
    );
    expect(result.forecast.expectedIncidents).toBeGreaterThan(0);
    expect(result.forecast.likelyRange.low).toBeGreaterThanOrEqual(0);
    expect(result.forecast.byType[0]).toEqual(
      expect.objectContaining({ key: 'TRAFFIC_ACCIDENT' }),
    );
    expect(result.forecast.dailySeries).toHaveLength(14);
    expect(result.forecast.dailySeries.slice(-7)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: 'forecast',
          observed: null,
          expected: expect.any(Number),
        }),
      ]),
    );
    expect(result.methodology.dataSource).toBe('simulated_incidents');
  });

  it('returns an honest empty simulation forecast', async () => {
    const service = new AnalyticsService({
      incidents: { findMany: jest.fn().mockResolvedValue([]) },
    } as never);

    const result = await service.findForecast({
      from: '2026-06-01T00:00:00.000Z',
      to: '2026-06-10T00:00:00.000Z',
    });

    expect(result.forecast).toEqual(
      expect.objectContaining({
        expectedIncidents: 0,
        likelyRange: { low: 0, high: 0 },
        confidence: 'very_low',
        sampleSize: 0,
        topIncidentType: null,
        topRegion: null,
        dailySeries: expect.any(Array),
        byType: [],
        byRegion: [],
      }),
    );
  });

  it('smooths weekday patterns when forecast history is sparse', async () => {
    const createdAt = new Date('2026-06-10T02:00:00.000Z');
    const service = new AnalyticsService({
      incidents: {
        findMany: jest.fn().mockResolvedValue(
          Array.from({ length: 4 }, () => ({
            incident_type: 'MEDICAL_EMERGENCY',
            inc_location: 'Central',
            latitude: null,
            longitude: null,
            created_at: createdAt,
          })),
        ),
      },
    } as never);

    const result = await service.findForecast({
      from: '2026-05-12T00:00:00.000+08:00',
      to: '2026-06-11T23:59:59.999+08:00',
      days: '7',
    });
    const dailyExpected = result.forecast.dailySeries
      .slice(-7)
      .map((item) => item.expected ?? 0);

    expect(result.forecast.expectedIncidents).toBeGreaterThan(0);
    expect(Math.max(...dailyExpected)).toBeLessThan(
      Math.min(...dailyExpected) * 4,
    );
  });

  it('rejects an invalid forecast horizon', async () => {
    const service = new AnalyticsService({} as never);

    await expect(service.findForecast({ days: '31' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
