import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { GeminiConfig, loadGeminiConfig } from './gemini.config';

const EMBEDDING_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 250;
const DEFAULT_MAX_DELAY_MS = 8000;

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export class GeminiClient {
  private readonly genAI: GoogleGenerativeAI;
  private readonly config: GeminiConfig;
  private readonly retryOptions: RetryOptions;

  constructor(config?: Partial<GeminiConfig>, retryOptions?: RetryOptions) {
    this.config = { ...loadGeminiConfig(), ...config };
    this.retryOptions = retryOptions ?? {};
    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const model = this.genAI.getGenerativeModel({ model: this.config.embeddingModel });

    return this.withRetry(
      async () => {
        const result = await model.embedContent(text);
        return result.embedding.values;
      },
      'embedContent',
      'embedding',
      this.config.embeddingModel
    );
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ model: this.config.embeddingModel });

    return this.withRetry(
      async () => {
        const results = await Promise.all(
          texts.map((text) => model.embedContent(text))
        );
        return results.map((result) => result.embedding.values);
      },
      'embedContent',
      'embedding batch',
      this.config.embeddingModel
    );
  }

  async generateContent(
    prompt: string,
    context?: Content[]
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.config.model,
      });

      const chat = context ? model.startChat({ history: context }) : undefined;

      if (chat) {
        const result = await chat.sendMessage(prompt);
        return result.response.text();
      }

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.logFailure('generateContent', 'text generation', this.config.model, error);
      throw error;
    }
  }

  private async withRetry<T>(
    fn: () => Promise<T>,
    operation: string,
    phase: string,
    modelName: string
  ): Promise<T> {
    const maxRetries = this.retryOptions.maxRetries ?? DEFAULT_MAX_RETRIES;
    const baseDelayMs = this.retryOptions.baseDelayMs ?? DEFAULT_BASE_DELAY_MS;
    const maxDelayMs = this.retryOptions.maxDelayMs ?? DEFAULT_MAX_DELAY_MS;

    let attempt = 0;

    for (;;) {
      try {
        return await fn();
      } catch (error) {
        const status = (error as any)?.status;
        const retryable = EMBEDDING_RETRYABLE_STATUSES.has(status);

        if (!retryable || attempt >= maxRetries) {
          this.logFailure(operation, phase, modelName, error);
          throw error;
        }

        attempt++;
        const delay = this.computeDelay(attempt, baseDelayMs, maxDelayMs);
        console.warn('[GeminiClient] retrying after temporary failure', {
          operation,
          phase,
          status,
          attempt,
          maxRetries,
          delayMs: Math.round(delay),
        });
        await this.sleep(delay);
      }
    }
  }

  private computeDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
    const exponential = baseDelayMs * Math.pow(2, attempt - 1);
    const capped = Math.min(exponential, maxDelayMs);
    const jitter = Math.random() * capped * 0.5;
    return capped * 0.5 + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private logFailure(operation: string, phase: string, modelName: string, error: unknown): void {
    const errorInfo = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error;

    console.error('[GeminiClient] API call failed', {
      operation,
      phase,
      modelName,
      status: (error as any)?.status,
      statusText: (error as any)?.statusText,
      details: errorInfo,
    });
  }
}