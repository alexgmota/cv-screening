import { createContainer, asFunction, InjectionMode } from 'awilix';
import { CvIngestionService } from './application/cv/cv-ingestion.service';
import { CvIngestionUseCase } from './application/cv/cv-ingestion.use-case';
import { getPool } from './infrastructure/database/postgres';
import { UnitOfWorkImpl } from './infrastructure/database/unit-of-work.impl';
import { TextChunkerService } from './infrastructure/pdf/text-chunker.service';
import { GeminiClient } from './infrastructure/gemini/gemini.client';

export const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

container.register({
  pool: asFunction(getPool).singleton(),
  unitOfWork: asFunction((pool) => new UnitOfWorkImpl(pool)).singleton(),
  geminiClient: asFunction(() => new GeminiClient(undefined, {
    maxRetries: parseInt(process.env.GEMINI_RETRY_MAX || '3', 10),
    baseDelayMs: parseInt(process.env.GEMINI_RETRY_BASE_DELAY_MS || '250', 10),
    maxDelayMs: parseInt(process.env.GEMINI_RETRY_MAX_DELAY_MS || '8000', 10),
  })).singleton(),
  chunker: asFunction(() => new TextChunkerService({
    maxTokens: parseInt(process.env.CHUNK_SIZE || '512', 10),
    overlapTokens: parseInt(process.env.CHUNK_OVERLAP || '50', 10),
  })).transient(),
  cvIngestionService: asFunction((geminiClient, unitOfWork, chunker) =>
    new CvIngestionService(geminiClient, unitOfWork, chunker)
  ).transient(),
  cvIngestionUseCase: asFunction((cvIngestionService) =>
    new CvIngestionUseCase(cvIngestionService)
  ).transient(),
});
