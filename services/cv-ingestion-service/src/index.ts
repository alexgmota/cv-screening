import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import { requestIdMiddleware } from './interfaces/middleware/request-id.middleware';
import { errorMiddleware } from './interfaces/middleware/error.middleware';
import { healthRoutes } from './interfaces/routes/health.routes';
import { createCvRoutes } from './interfaces/routes/cv.routes';
import { CvIngestionUseCase } from './application/cv/cv-ingestion.use-case';
import { container } from './di.container';

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