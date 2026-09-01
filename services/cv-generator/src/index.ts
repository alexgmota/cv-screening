import express, { Express } from 'express';
import cors from 'cors';
import { GenerationUseCase } from './application/generation/cv-generation.use-case';
import { container } from './di.container';
import { requestIdMiddleware } from './interfaces/middleware/request-id.middleware';
import { errorMiddleware } from './interfaces/middleware/error.middleware';
import { createGenerationRoutes } from './interfaces/routes/generation.routes';

const PORT = Number(process.env.PORT) || 4001;

export function createApp(): Express {
  const app: Express = express();
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  }));
  app.use(express.json());
  app.use(requestIdMiddleware);
  app.use('/api', createGenerationRoutes(
    container.resolve<GenerationUseCase>('generationUseCase')
  ));
  app.use(errorMiddleware);
  return app;
}

const app = createApp();

app.listen(PORT, () => {
  console.log(`CV Generator service running on port ${PORT}`);
});

export default app;