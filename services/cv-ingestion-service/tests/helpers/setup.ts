import express, { Express } from 'express';
import cors from 'cors';
import { vi } from 'vitest';
import { requestIdMiddleware } from '../../src/interfaces/middleware/request-id.middleware';
import { errorMiddleware } from '../../src/interfaces/middleware/error.middleware';
import { healthRoutes } from '../../src/interfaces/routes/health.routes';
import { createCvRoutes } from '../../src/interfaces/routes/cv.routes';

export interface MockIngestionUseCase {
  execute: ReturnType<typeof vi.fn>;
}

export function createMockIngestionUseCase(
  overrides?: Partial<MockIngestionUseCase>
): MockIngestionUseCase {
  return {
    execute: vi.fn(),
    ...overrides,
  };
}

export function createTestApp({
  ingestionUseCase,
}: {
  ingestionUseCase?: MockIngestionUseCase;
} = {}): Express {
  const app: Express = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestIdMiddleware);

  app.use('/api', healthRoutes);

  if (ingestionUseCase) {
    app.use('/api', createCvRoutes(ingestionUseCase as any));
  }

  app.use(errorMiddleware);

  return app;
}