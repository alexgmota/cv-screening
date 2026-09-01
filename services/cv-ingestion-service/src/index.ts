import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import { createContainer, asFunction, InjectionMode } from 'awilix';
import { requestIdMiddleware } from './interfaces/middleware/request-id.middleware';
import { errorMiddleware } from './interfaces/middleware/error.middleware';
import { healthRoutes } from './interfaces/routes/health.routes';
import { createCvRoutes } from './interfaces/routes/cv.routes';
import { CvIngestionService } from './application/cv/cv-ingestion.service';
import { CvIngestionUseCase } from './application/cv/cv-ingestion.use-case';
import { getPool } from './infrastructure/database/postgres';
import { UnitOfWorkImpl } from './infrastructure/database/unit-of-work.impl';
import { TextChunkerService } from './infrastructure/pdf/text-chunker.service';
import { GeminiClient } from './infrastructure/gemini/gemini.client';

const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

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

export function createApp(): Express {
  const app: Express = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));

  app.use(express.json());
  app.use(requestIdMiddleware);

  const cvIngestionUseCase = container.resolve<CvIngestionUseCase>('cvIngestionUseCase');

  app.use('/api', healthRoutes);
  app.use('/api', createCvRoutes(cvIngestionUseCase));

  app.use(errorMiddleware);

  return app;
}

const PORT = process.env.PORT || 4003;

if (require.main === module) {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`CV ingestion service running on port ${PORT}`);
  });
}

export default createApp();