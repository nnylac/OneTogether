import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { IncidentResourceExtractorService } from './incident-resource-extractor.service';
import type { RawAgencyMessage } from './incident-middleware.types';

describe('IncidentResourceExtractorService', () => {
  let service: IncidentResourceExtractorService;
  let upsert: jest.Mock;

  beforeEach(async () => {
    upsert = jest.fn().mockResolvedValue({});

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentResourceExtractorService,
        {
          provide: PrismaService,
          useValue: { incident_resources: { upsert } },
        },
      ],
    }).compile();

    service = module.get(IncidentResourceExtractorService);
  });

  const incidentId = '00000000-0000-0000-0000-000000000001';
  const destination = { lat: 1.3329, lng: 103.848 };

  function messageWithResources(
    status: string,
    overrides: Record<string, unknown> = {},
  ): RawAgencyMessage {
    return {
      sender: { agency_id: 'SCDF' },
      incident: { triggered_at: '2026-06-08T01:00:00.000Z' },
      ticket: {
        ticket_id: 'SCDF-ABCD1234',
        status,
        data: {
          resources_dispatched: {
            fire_engines: [
              { unit_id: 'PE742', station: 'CDS', eta_minutes: 7 },
            ],
            rescue_teams: [{ team_id: 'RT42', specialisation: 'Hazmat' }],
            ambulances: [{ amb_id: 'AM123', paramedic_count: 3 }],
            ...overrides,
          },
        },
      },
    };
  }

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('upserts one row per dispatched unit with resolved origin and ETA', async () => {
    await service.extract(
      incidentId,
      'SCDF',
      'OPEN',
      destination,
      messageWithResources('OPEN'),
    );

    expect(upsert).toHaveBeenCalledTimes(3);

    const fireEngineCall = upsert.mock.calls.find(
      ([arg]) => arg.where.incident_id_unit_ref.unit_ref === 'PE742',
    )?.[0];
    expect(fireEngineCall.create.resource_kind).toBe('fire_engine');
    expect(fireEngineCall.create.origin_station).toBe('CDS');
    // CDS has reference coordinates, so origin should be populated.
    expect(typeof fireEngineCall.create.origin_lat).toBe('number');
    expect(fireEngineCall.create.eta_minutes).toBe(7);
    expect(fireEngineCall.create.eta_at).toBeInstanceOf(Date);
    expect(fireEngineCall.create.status).toBe('dispatched');
  });

  it('derives an ETA when the payload omits eta_minutes', async () => {
    await service.extract(
      incidentId,
      'SCDF',
      'OPEN',
      destination,
      messageWithResources('OPEN'),
    );

    const ambulanceCall = upsert.mock.calls.find(
      ([arg]) => arg.where.incident_id_unit_ref.unit_ref === 'AM123',
    )?.[0];
    expect(ambulanceCall.create.eta_minutes).toBeGreaterThanOrEqual(1);
    expect(ambulanceCall.create.eta_at).toBeInstanceOf(Date);
  });

  it('maps ticket status to resource status', async () => {
    await service.extract(
      incidentId,
      'SCDF',
      'IN_PROGRESS',
      destination,
      messageWithResources('IN_PROGRESS'),
    );

    expect(upsert.mock.calls[0][0].create.status).toBe('on_scene');
    expect(upsert.mock.calls[0][0].update.status).toBe('on_scene');
  });

  it('does nothing when there are no dispatched resources', async () => {
    await service.extract(incidentId, 'SPF', 'OPEN', destination, {
      sender: { agency_id: 'SPF' },
      ticket: { ticket_id: 'SPF-1', status: 'OPEN', data: {} },
    });

    expect(upsert).not.toHaveBeenCalled();
  });

  it('still records units when the incident has no coordinates', async () => {
    await service.extract(
      incidentId,
      'SCDF',
      'OPEN',
      null,
      messageWithResources('OPEN'),
    );

    const ambulanceCall = upsert.mock.calls.find(
      ([arg]) => arg.where.incident_id_unit_ref.unit_ref === 'AM123',
    )?.[0];
    // No destination → no fallback ETA possible for units without a payload ETA.
    expect(ambulanceCall.create.eta_minutes).toBeNull();
    expect(ambulanceCall.create.eta_at).toBeNull();
  });
});
