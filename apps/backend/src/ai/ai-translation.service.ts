import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AiService, AiUnavailableError } from './ai.service';

export type TranslationTargetLanguage = 'zh' | 'ms' | 'ta';

export const TRANSLATION_TARGET_LANGUAGES: TranslationTargetLanguage[] = [
  'zh',
  'ms',
  'ta',
];

const LANGUAGE_NAMES: Record<TranslationTargetLanguage, string> = {
  zh: 'Simplified Chinese',
  ms: 'Malay',
  ta: 'Tamil',
};

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 100;

type CacheEntry = { translations: string[]; expires: number };

@Injectable()
export class AiTranslationService {
  // Per-pod cache: citizen pages re-request the same alert texts on every
  // load and language flip, so identical batches must not re-bill OpenAI.
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly aiService: AiService) {}

  async translateTexts(input: {
    targetLanguage: TranslationTargetLanguage;
    texts: string[];
  }): Promise<string[]> {
    const { targetLanguage, texts } = input;

    const key =
      targetLanguage +
      ':' +
      createHash('sha1').update(texts.join('␟')).digest('hex');
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.translations;
    }

    const result = await this.aiService.completeJson<{
      translations: string[];
    }>({
      schemaName: 'page_translations',
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['translations'],
        properties: {
          translations: { type: 'array', items: { type: 'string' } },
        },
      },
      maxOutputTokens: 4000,
      temperature: 0.2,
      system: [
        'You translate official Singapore emergency-communication text into',
        `${LANGUAGE_NAMES[targetLanguage]} for the OneTogether public alerts`,
        'platform. Preserve meaning, urgency, and the official register.',
        'Keep proper nouns, place names, and agency acronyms (SCDF, SPF,',
        'PUB, NEA, MRT) in Latin script where conventional. Return exactly',
        `${texts.length} translations, one per input string, in the same`,
        'order as the input array.',
      ].join(' '),
      user: JSON.stringify({ texts }),
    });

    // Strict JSON schema cannot pin the array length, so enforce it here —
    // a mismatched batch would scramble every field on the page.
    if (
      !Array.isArray(result.translations) ||
      result.translations.length !== texts.length
    ) {
      throw new AiUnavailableError(
        `translation batch returned ${result.translations?.length ?? 0} items, expected ${texts.length}`,
      );
    }

    if (this.cache.size >= CACHE_MAX_ENTRIES) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(key, {
      translations: result.translations,
      expires: Date.now() + CACHE_TTL_MS,
    });

    return result.translations;
  }
}
