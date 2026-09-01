import { createContainer, asFunction, asValue, InjectionMode } from 'awilix';
import { ChatService } from './application/chat/chat.service';
import { CvQueryService } from './application/cv/cv-query.service';
import { getPool } from './infrastructure/database/postgres';
import { CvRepositoryImpl } from './infrastructure/database/cv.repository.impl';
import { EmbeddingRepositoryImpl } from './infrastructure/database/embedding.repository.impl';
import { GeminiClient } from './infrastructure/gemini/gemini.client';

export const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

container.register({
  pool: asFunction(getPool).singleton(),
  cvRepository: asFunction((pool) => new CvRepositoryImpl(pool)).transient(),
  embeddingRepository: asFunction((pool) => new EmbeddingRepositoryImpl(pool)).transient(),
  cvQueryService: asFunction((cvRepository, embeddingRepository) =>
    new CvQueryService(cvRepository, embeddingRepository)
  ).transient(),
  geminiClient: asFunction(() => new GeminiClient(undefined, {
    maxRetries: parseInt(process.env.GEMINI_RETRY_MAX || '3', 10),
    baseDelayMs: parseInt(process.env.GEMINI_RETRY_BASE_DELAY_MS || '250', 10),
    maxDelayMs: parseInt(process.env.GEMINI_RETRY_MAX_DELAY_MS || '8000', 10),
  })).singleton(),
  topKSources: asValue(parseInt(process.env.TOP_K_SOURCES || '3', 10)),
  chatService: asFunction((geminiClient, cvQueryService, topKSources) =>
    new ChatService(geminiClient, cvQueryService, topKSources)
  ).transient(),
});
