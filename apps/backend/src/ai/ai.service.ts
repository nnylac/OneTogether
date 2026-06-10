import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

/**
 * Thrown for every AI failure mode (missing key, network, quota, timeout,
 * malformed output). Callers catch this single type and fall back to the
 * existing rule-based behaviour — AI outages must never surface as a 500.
 */
export class AiUnavailableError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'AiUnavailableError';
    this.cause = cause;
  }
}

export interface CompleteJsonOptions {
  system: string;
  user: string;
  schemaName: string;
  schema: Record<string, unknown>;
  maxOutputTokens?: number;
  temperature?: number;
}

const DEFAULT_MODEL = 'gpt-4o-mini';
const REQUEST_TIMEOUT_MS = 20_000;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  /** Exposed for tests, which assign a mock client directly. */
  protected client: OpenAI | null = null;

  get isEnabled(): boolean {
    return (
      Boolean(process.env.OPENAI_API_KEY) &&
      process.env.AI_FEATURES_ENABLED !== 'false'
    );
  }

  get isClassificationEnabled(): boolean {
    return this.isEnabled && process.env.AI_CLASSIFICATION_ENABLED === 'true';
  }

  private getClient(): OpenAI {
    if (!this.client) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new AiUnavailableError('OPENAI_API_KEY is not configured');
      }
      this.client = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        timeout: REQUEST_TIMEOUT_MS,
        maxRetries: 1,
      });
    }
    return this.client;
  }

  /**
   * Single completion returning schema-constrained JSON. Throws
   * AiUnavailableError on any failure so callers have exactly one
   * error type to catch before falling back.
   */
  async completeJson<T>(options: CompleteJsonOptions): Promise<T> {
    if (!this.isEnabled) {
      throw new AiUnavailableError('AI features are disabled');
    }

    const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;
    let raw: string;
    try {
      const completion = await this.getClient().chat.completions.create({
        model,
        temperature: options.temperature ?? 0.3,
        max_tokens: options.maxOutputTokens ?? 1000,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: options.schemaName,
            strict: true,
            schema: options.schema,
          },
        },
        messages: [
          { role: 'system', content: options.system },
          { role: 'user', content: options.user },
        ],
      });
      raw = completion.choices[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.warn(
        `OpenAI request failed (${options.schemaName}): ${String(error)}`,
      );
      throw new AiUnavailableError('OpenAI request failed', error);
    }

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.warn(
        `OpenAI returned non-JSON output (${options.schemaName})`,
      );
      throw new AiUnavailableError('OpenAI returned malformed JSON', error);
    }
  }
}
