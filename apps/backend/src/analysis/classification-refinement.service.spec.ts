import { ClassificationRefinementService } from './classification-refinement.service';
import { AiUnavailableError } from '../ai/ai.service';

function flushAsync() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

const baseIncident = {
  id: 'incident-1',
  title: 'Building fire',
  incident_type: 'BUILDING_FIRE',
  severity: 3,
  inc_status: 'RESPONDING',
  inc_location: 'Test Road',
  inc_description: 'Visible flames',
  category: 'fire',
  urgency: 'high',
  severity_estimate: 3,
  confidence: 0.7,
  logs: [],
};

function buildPrisma(incident: Record<string, unknown> = baseIncident) {
  return {
    incidents: {
      findUnique: jest.fn().mockResolvedValue(incident),
      update: jest.fn().mockResolvedValue({}),
    },
  };
}

const refinedResult = {
  category: 'fire',
  urgency: 'critical',
  severity_estimate: 5,
  confidence: 0.9,
};

describe('ClassificationRefinementService', () => {
  it('is a no-op when classification AI is disabled', async () => {
    const prisma = buildPrisma();
    const completeJson = jest.fn();
    const service = new ClassificationRefinementService(
      prisma as never,
      { isClassificationEnabled: false, completeJson } as never,
    );

    service.enqueue('incident-1');
    await flushAsync();

    expect(completeJson).not.toHaveBeenCalled();
    expect(prisma.incidents.findUnique).not.toHaveBeenCalled();
  });

  it('writes refined values on success', async () => {
    const prisma = buildPrisma();
    const completeJson = jest.fn().mockResolvedValue(refinedResult);
    const service = new ClassificationRefinementService(
      prisma as never,
      { isClassificationEnabled: true, completeJson } as never,
    );

    service.enqueue('incident-1');
    await flushAsync();

    expect(completeJson).toHaveBeenCalledTimes(1);
    expect(prisma.incidents.update).toHaveBeenCalledWith({
      where: { id: 'incident-1' },
      data: expect.objectContaining({
        category: 'fire',
        urgency: 'critical',
        severity_estimate: 5,
        severity: 5,
        confidence_score: 90,
      }),
    });
  });

  it('leaves keyword results untouched when the AI call fails', async () => {
    const prisma = buildPrisma();
    const completeJson = jest
      .fn()
      .mockRejectedValue(new AiUnavailableError('quota'));
    const service = new ClassificationRefinementService(
      prisma as never,
      { isClassificationEnabled: true, completeJson } as never,
    );

    service.enqueue('incident-1');
    await flushAsync();

    expect(prisma.incidents.update).not.toHaveBeenCalled();
  });

  it('skips the write when the incident closed mid-flight', async () => {
    const prisma = {
      incidents: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(baseIncident)
          .mockResolvedValueOnce({ inc_status: 'CLOSED' }),
        update: jest.fn(),
      },
    };
    const completeJson = jest.fn().mockResolvedValue(refinedResult);
    const service = new ClassificationRefinementService(
      prisma as never,
      { isClassificationEnabled: true, completeJson } as never,
    );

    service.enqueue('incident-1');
    await flushAsync();

    expect(prisma.incidents.update).not.toHaveBeenCalled();
  });

  it('dedupes rapid enqueues for the same incident', async () => {
    const prisma = buildPrisma();
    let resolveCall: (value: unknown) => void = () => undefined;
    const completeJson = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCall = resolve;
        }),
    );
    const service = new ClassificationRefinementService(
      prisma as never,
      { isClassificationEnabled: true, completeJson } as never,
    );

    service.enqueue('incident-1');
    await flushAsync();
    // First call is in flight; these collapse into a single dirty re-run.
    service.enqueue('incident-1');
    service.enqueue('incident-1');
    service.enqueue('incident-1');
    expect(completeJson).toHaveBeenCalledTimes(1);

    resolveCall(refinedResult);
    await flushAsync();
    await flushAsync();

    // Exactly one re-run after the in-flight call finished.
    expect(completeJson).toHaveBeenCalledTimes(2);
  });
});
