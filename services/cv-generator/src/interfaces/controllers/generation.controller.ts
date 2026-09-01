import { Request, Response, NextFunction } from 'express';
import { CvDomainError } from '../../domain/shared/app-error';
import {
  GenerationUseCase,
  GenerateRequest,
  GenerateResponse
} from '../../application/generation/cv-generation.use-case';

/**
 * HTTP controller for CV generation endpoints.
 * Validates request bodies, delegates to the GenerationUseCase, and formats responses.
 */
export class GenerationController {
  private readonly useCase: GenerationUseCase;

  constructor(useCase: GenerationUseCase) {
    this.useCase = useCase;
  }

  /**
   * Handles POST /api/cv/generate.
   * Validates the request body and returns the accepted job quickly.
   */
  async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = (req as Request & { requestId?: string }).requestId;

    try {
      const body = req.body as Partial<GenerateRequest>;
      console.log('[cv-generator] generate request received', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        count: body.count,
      });

      if (!Number.isInteger(body.count) || (body.count ?? 0) <= 0) {
        throw new CvDomainError(
          'VALIDATION_ERROR',
          'count is required and must be a positive integer'
        );
      }

      const response: GenerateResponse = await this.useCase.execute({
        count: body.count as number
      });

      console.log('[cv-generator] generation accepted', {
        requestId,
        jobId: response.jobId,
        count: body.count,
      });

      res.status(202).json(response);
    } catch (err) {
      console.error('[cv-generator] generate request failed', {
        requestId,
        method: req.method,
        path: req.originalUrl,
        error: err,
      });
      next(err);
    }
  }

  /**
   * Handles GET /api/status/:jobId.
   * Returns the current status of a previously accepted generation job.
   */
  async status(req: Request, res: Response, next: NextFunction): Promise<void> {
    const requestId = (req as Request & { requestId?: string }).requestId;

    try {
      const jobId: string = req.params.jobId;
      console.log('[cv-generator] status request received', {
        requestId,
        jobId,
      });

      const job = this.useCase.getJobStatus(jobId);

      if (!job) {
        throw new CvDomainError(
          'NOT_FOUND',
          `Generation job ${jobId} not found`
        );
      }

      res.json(job);
    } catch (err) {
      console.error('[cv-generator] status request failed', {
        requestId,
        jobId: req.params.jobId,
        error: err,
      });
      next(err);
    }
  }
}