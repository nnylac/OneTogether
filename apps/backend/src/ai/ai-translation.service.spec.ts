import { AiTranslationService } from './ai-translation.service';
import { AiUnavailableError } from './ai.service';

function buildService(completeJson: jest.Mock) {
  return new AiTranslationService({ completeJson } as never);
}

describe('AiTranslationService', () => {
  it('returns translations in input order', async () => {
    const completeJson = jest
      .fn()
      .mockResolvedValue({ translations: ['一', '二'] });
    const service = buildService(completeJson);

    const result = await service.translateTexts({
      targetLanguage: 'zh',
      texts: ['one', 'two'],
    });

    expect(result).toEqual(['一', '二']);
    const payload = JSON.parse(
      (completeJson.mock.calls[0][0] as { user: string }).user,
    ) as { texts: string[] };
    expect(payload.texts).toEqual(['one', 'two']);
  });

  it('throws AiUnavailableError when the batch length does not match', async () => {
    const completeJson = jest
      .fn()
      .mockResolvedValue({ translations: ['only one'] });
    const service = buildService(completeJson);

    await expect(
      service.translateTexts({ targetLanguage: 'ms', texts: ['a', 'b'] }),
    ).rejects.toBeInstanceOf(AiUnavailableError);
  });

  it('serves identical batches from the cache', async () => {
    const completeJson = jest
      .fn()
      .mockResolvedValue({ translations: ['satu'] });
    const service = buildService(completeJson);

    const first = await service.translateTexts({
      targetLanguage: 'ms',
      texts: ['one'],
    });
    const second = await service.translateTexts({
      targetLanguage: 'ms',
      texts: ['one'],
    });

    expect(first).toEqual(['satu']);
    expect(second).toEqual(['satu']);
    expect(completeJson).toHaveBeenCalledTimes(1);
  });

  it('caches per target language', async () => {
    const completeJson = jest
      .fn()
      .mockResolvedValueOnce({ translations: ['satu'] })
      .mockResolvedValueOnce({ translations: ['ஒன்று'] });
    const service = buildService(completeJson);

    await service.translateTexts({ targetLanguage: 'ms', texts: ['one'] });
    const tamil = await service.translateTexts({
      targetLanguage: 'ta',
      texts: ['one'],
    });

    expect(tamil).toEqual(['ஒன்று']);
    expect(completeJson).toHaveBeenCalledTimes(2);
  });
});
