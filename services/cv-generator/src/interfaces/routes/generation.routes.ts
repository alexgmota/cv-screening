import { Router } from 'express';
import { GenerationController } from '../controllers/generation.controller';
import { GenerationUseCase } from '../../application/generation/cv-generation.use-case';

/**
 * Express router for CV generation endpoints.
 * Wires the generation controller to the POST /cv/generate and GET /status routes.
 */
export function createGenerationRoutes(useCase: GenerationUseCase): Router {
  const router: Router = Router();
  const controller = new GenerationController(useCase);

  router.post('/cv/generate', controller.generate.bind(controller));
  router.get('/status/:jobId', controller.status.bind(controller));

  return router;
}