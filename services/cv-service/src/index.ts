import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './interfaces/middleware/request-id.middleware';
import { errorMiddleware } from './interfaces/middleware/error.middleware';
import { healthRoutes } from './interfaces/routes/health.routes';
import { createCvRoutes } from './interfaces/routes/cv.routes';
import { createChatRoutes } from './interfaces/routes/chat.routes';
import { CvQueryService } from './application/cv/cv-query.service';
import { ChatService } from './application/chat/chat.service';
import { container } from './di.container';

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