import { AiBroadcastService } from './ai-broadcast.service';

const activeIncidents = [
  {
    title: 'Flash flood at Bedok',
    incident_type: 'FLOODING',
    severity: 4,
    inc_location: 'Bedok North Ave 1',
    category: 'flood',
    urgency: 'high',
    latitude: 1.33,
    longitude: 103.93,
  },
  {
    title: 'Fire at Jurong',
    incident_type: 'BUILDING_FIRE',
    severity: 3,
    inc_location: 'Jurong West St 52',
    category: 'fire',
    urgency: 'high',
    latitude: 1.34,
    longitude: 103.7,
  },
];

function buildService(completeJson: jest.Mock) {
  const prisma = {
    incidents: { findMany: jest.fn().mockResolvedValue(activeIncidents) },
  };
  return new AiBroadcastService(prisma as never, { completeJson } as never);
}

describe('AiBroadcastService', () => {
  it('grounds zone drafts in incidents from that region', async () => {
    const completeJson = jest
      .fn()
      .mockResolvedValue({ title: 'Flood warning', message: 'Stay clear.' });
    const service = buildService(completeJson);

    const result = await service.draftBroadcast({
      audience: 'Zone',
      zone: 'East',
      severity: 'warning',
    });

    expect(result.groundedIncidentCount).toBe(1);
    const payload = JSON.parse(
      (completeJson.mock.calls[0][0] as { user: string }).user,
    ) as { activeIncidents: Array<{ title: string }> };
    expect(payload.activeIncidents).toHaveLength(1);
    expect(payload.activeIncidents[0].title).toBe('Flash flood at Bedok');
  });

  it('uses all active incidents for unmapped zones like Nationwide', async () => {
    const completeJson = jest
      .fn()
      .mockResolvedValue({ title: 'Advisory', message: 'Stay alert.' });
    const service = buildService(completeJson);

    const result = await service.draftBroadcast({
      audience: 'Public',
      zone: 'Nationwide',
      severity: 'info',
    });

    expect(result.groundedIncidentCount).toBe(2);
  });

  it('caps the draft title at 120 characters', async () => {
    const completeJson = jest.fn().mockResolvedValue({
      title: 'x'.repeat(200),
      message: 'Message.',
    });
    const service = buildService(completeJson);

    const result = await service.draftBroadcast({
      audience: 'Public',
      zone: 'Nationwide',
      severity: 'info',
    });

    expect(result.title).toHaveLength(120);
  });

  it('returns all four languages from translate', async () => {
    const entry = { title: 'T', message: 'M' };
    const completeJson = jest
      .fn()
      .mockResolvedValue({ en: entry, zh: entry, ms: entry, ta: entry });
    const service = buildService(completeJson);

    const result = await service.translateBroadcast({
      title: 'T',
      message: 'M',
    });

    expect(Object.keys(result.translations).sort()).toEqual([
      'en',
      'ms',
      'ta',
      'zh',
    ]);
  });
});
