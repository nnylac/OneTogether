import { AiService, AiUnavailableError } from './ai.service';

const baseOptions = {
  system: 'system prompt',
  user: '{}',
  schemaName: 'test_schema',
  schema: { type: 'object' },
};

function withMockClient(service: AiService, content: string | null) {
  const create = jest.fn().mockResolvedValue({
    choices: [{ message: { content } }],
  });
  (service as unknown as { client: unknown }).client = {
    chat: { completions: { create } },
  };
  return create;
}

describe('AiService', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('is disabled without an API key and rejects with AiUnavailableError', async () => {
    delete process.env.OPENAI_API_KEY;
    const service = new AiService();

    expect(service.isEnabled).toBe(false);
    await expect(service.completeJson(baseOptions)).rejects.toBeInstanceOf(
      AiUnavailableError,
    );
  });

  it('honours the AI_FEATURES_ENABLED kill switch', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.AI_FEATURES_ENABLED = 'false';

    expect(new AiService().isEnabled).toBe(false);
  });

  it('gates classification behind AI_CLASSIFICATION_ENABLED', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.AI_FEATURES_ENABLED;
    process.env.AI_CLASSIFICATION_ENABLED = 'false';
    expect(new AiService().isClassificationEnabled).toBe(false);

    process.env.AI_CLASSIFICATION_ENABLED = 'true';
    expect(new AiService().isClassificationEnabled).toBe(true);
  });

  it('parses schema-constrained JSON output', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const service = new AiService();
    const create = withMockClient(service, '{"answer":"ok"}');

    const result = await service.completeJson<{ answer: string }>(baseOptions);

    expect(result).toEqual({ answer: 'ok' });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        response_format: expect.objectContaining({ type: 'json_schema' }),
      }),
    );
  });

  it('wraps malformed JSON output in AiUnavailableError', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const service = new AiService();
    withMockClient(service, 'not json');

    await expect(service.completeJson(baseOptions)).rejects.toBeInstanceOf(
      AiUnavailableError,
    );
  });

  it('wraps client failures (timeout, quota) in AiUnavailableError', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const service = new AiService();
    (service as unknown as { client: unknown }).client = {
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('429 rate limit')),
        },
      },
    };

    await expect(service.completeJson(baseOptions)).rejects.toBeInstanceOf(
      AiUnavailableError,
    );
  });
});
