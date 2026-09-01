import express, { Express } from 'express';
import cors from 'cors';
import { requestIdMiddleware } from '../../src/interfaces/middleware/request-id.middleware';
import { errorMiddleware } from '../../src/interfaces/middleware/error.middleware';
import { healthRoutes } from '../../src/interfaces/routes/health.routes';
import { createChatRoutes } from '../../src/interfaces/routes/chat.routes';
import { createCvRoutes } from '../../src/interfaces/routes/cv.routes';

export interface MockChatService {
  answer: ReturnType<typeof vi.fn>;
}

export interface MockCvRepository {
  findById: ReturnType<typeof vi.fn>;
  findAll: ReturnType<typeof vi.fn>;
}

export function createMockChatService(overrides?: Partial<MockChatService>): MockChatService {
  return {
    answer: vi.fn(),
    ...overrides,
  };
}

export function createMockCvRepository(overrides?: Partial<MockCvRepository>): MockCvRepository {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    ...overrides,
  };
}

export function createTestApp({
  chatService,
  cvRepository,
}: {
  chatService?: MockChatService;
  cvRepository?: MockCvRepository;
} = {}): Express {
  const app: Express = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestIdMiddleware);

  app.use('/api', healthRoutes);

  if (chatService) {
    app.use('/api', createChatRoutes(chatService as any));
  }

  if (cvRepository) {
    app.use('/api', createCvRoutes(cvRepository as any));
  }

  app.use(errorMiddleware);

  return app;
}