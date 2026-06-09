import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { MapsService } from './maps.service';

describe('MapsService', () => {
  let service: MapsService;
  let findUnique: jest.Mock;

  beforeEach(async () => {
    findUnique = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MapsService,
        {
          provide: PrismaService,
          useValue: { incidents: { findUnique } },
        },
      ],
    }).compile();

    service = module.get(MapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws when the incident does not exist', async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      service.getIncidentMap('00000000-0000-0000-0000-000000000099'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('shapes incident + resources and computes summary counts', async () => {
    const now = new Date('2026-06-08T01:05:00.000Z');
    findUnique.mockResolvedValue({
      id: 'inc-1',
      code: 'EXT1A2B3C',
      title: 'SCDF - FIRE - Toa Payoh',
      incident_type: 'FIRE',
      severity: 4,
      inc_status: 'ACTIVE',
      inc_location: 'Toa Payoh Hub',
      latitude: 1.3329,
      longitude: 103.848,
      incident_resources: [
        {
          id: 'r1',
          unit_ref: 'PE742',
          agency: 'SCDF',
          resource_kind: 'fire_engine',
          status: 'dispatched',
          origin_station: 'CDS',
          origin_lat: 1.2966,
          origin_lng: 103.8485,
          eta_minutes: 7,
          eta_at: now,
          dispatched_at: now,
          updated_at: now,
          notes: 'Fire appliance',
        },
        {
          id: 'r2',
          unit_ref: 'AM123',
          agency: 'SCDF',
          resource_kind: 'ambulance',
          status: 'on_scene',
          origin_station: null,
          origin_lat: 1.333,
          origin_lng: 103.9,
          eta_minutes: 5,
          eta_at: now,
          dispatched_at: now,
          updated_at: now,
          notes: null,
        },
      ],
    });

    const result = await service.getIncidentMap('inc-1');

    expect(result.incident.status).toBe('active');
    expect(result.incident.lat).toBe(1.3329);
    expect(result.resources).toHaveLength(2);
    expect(result.resources[0].destLat).toBe(1.3329);
    expect(result.resources[0].etaAt).toBe(now.toISOString());
    expect(result.summary).toEqual({
      total: 2,
      dispatched: 1,
      enRoute: 0,
      onScene: 1,
      returning: 0,
      unavailable: 0,
      completed: 0,
    });
  });
});
