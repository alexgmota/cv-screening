import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * Health check endpoint.
 * Returns service status, uptime, and timestamp.
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'cv-ingestion-service',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

export { router as healthRoutes };