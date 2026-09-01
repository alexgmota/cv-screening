import { Router } from 'express';
import { CvController } from '../controllers/cv.controller';
import { ICvQueryService } from '../../application/cv/cv-query.service';

/**
 * Creates the read-only CV router with controller dependencies wired in.
 */
export function createCvRoutes(cvQueryService: ICvQueryService): Router {
  const router: Router = Router();
  const controller = new CvController(cvQueryService);

  router.get('/cvs', (req, res, next) => controller.getAllCvs(req, res, next));
  router.get('/cvs/:id', (req, res, next) => controller.getCvById(req, res, next));
  router.get('/cvs/:id/pdf', (req, res, next) => controller.getCvPdf(req, res, next));

  return router;
}