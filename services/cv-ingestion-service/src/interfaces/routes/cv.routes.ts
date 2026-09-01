import { Router } from 'express';
import { CvController } from '../controllers/cv.controller';
import { CvIngestionUseCase } from '../../application/cv/cv-ingestion.use-case';

/**
 * Creates CV router with controller dependencies wired in.
 */
export function createCvRoutes(cvIngestionUseCase?: CvIngestionUseCase): Router {
  const router: Router = Router();
  const controller = new CvController(cvIngestionUseCase);

  router.post('/cvs/index', (req, res, next) => controller.indexGeneratedCv(req, res, next));

  return router;
}