import { IncidentNormalizerService } from './incident-normalizer.service';

describe('IncidentNormalizerService', () => {
  const service = new IncidentNormalizerService();

  it('normalizes shared identity and coordinates from the incident envelope', () => {
    const result = service.normalize({
      sender: { agency_id: 'SPF', org_id: 'SPF', system_id: 'POLARIS' },
      external_incident_id: 'incident-123',
      incident: {
        incident_type: 'TRAFFIC_ACCIDENT',
        severity: 3,
        description: 'Collision at a junction',
        location: {
          name: 'Test Road',
          area: 'Central',
          lat: 1.301,
          lng: 103.801,
          reported_accuracy: 'APPROXIMATE',
        },
      },
      ticket: {
        ticket_id: 'SPF-123',
        status: 'OPEN',
        data: {},
      },
    });

    expect(result.externalIncidentId).toBe('incident-123');
    expect(result.externalTicketId).toBe('SPF-123');
    expect(result.latitude).toBe(1.301);
    expect(result.longitude).toBe(103.801);
  });
});
