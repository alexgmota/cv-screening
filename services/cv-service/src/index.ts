import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import { createContainer, asFunction, asValue, InjectionMode } from 'awilix';
import { requestIdMiddleware } from './interfaces/middleware/request-id.middleware';
import { errorMiddleware } from './interfaces/middleware/error.middleware';
import { healthRoutes } from './interfaces/routes/health.routes';
import { createCvRoutes } from './interfaces/routes/cv.routes';
import { createChatRoutes } from './interfaces/routes/chat.routes';
import { ChatService } from './application/chat/chat.service';
import { CvQueryService } from './application/cv/cv-query.service';
import { getPool } from './infrastructure/database/postgres';
import { CvRepositoryImpl } from './infrastructure/database/cv.repository.impl';
import { EmbeddingRepositoryImpl } from './infrastructure/database/embedding.repository.impl';
import { GeminiClient } from './infrastructure/gemini/gemini.client';

const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

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

export function createApp(): Express {
  const app: Express = express();

  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));

  app.use(express.json());
  app.use(requestIdMiddleware);

  const cvQueryService = container.resolve<CvQueryService>('cvQueryService');
  const chatService = container.resolve<ChatService>('chatService');

  app.use('/api', healthRoutes);
  app.use('/api', createCvRoutes(cvQueryService));
  app.use('/api', createChatRoutes(chatService));

  app.use(errorMiddleware);

  return app;
}

const PORT = process.env.PORT || 4002;

if (require.main === module) {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`CV service running on port ${PORT}`);
  });
}

export default createApp();