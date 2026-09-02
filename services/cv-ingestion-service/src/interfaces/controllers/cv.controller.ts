import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../domain/shared/app-error';
import { CvIngestionUseCase } from '../../application/cv/cv-ingestion.use-case';

/**
 * Controller handling the CV ingestion endpoint.
 */
export class CvController {
  constructor(
    private readonly cvIngestionUseCase?: CvIngestionUseCase
  ) {}

  async indexGeneratedCv(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { pdfPath } = req.body as { pdfPath?: unknown };

      if (!this.cvIngestionUseCase) {
        throw new DomainError('STORAGE_ERROR', 'CV ingestion service is not configured');
      }

      if (typeof pdfPath !== 'string' || !pdfPath.trim()) {
        throw new DomainError('VALIDATION_ERROR', 'pdfPath is required');
      }

      const requestId = (req as Request & { requestId?: string }).requestId;
      const cv = await this.cvIngestionUseCase.execute({ pdfPath: pdfPath.trim(), requestId });

      res.status(202).json({
        data: {
          id: cv.id,
          status: 'indexed',
        },
      });
    } catch (err) {
      next(err instanceof DomainError ? err : new DomainError('STORAGE_ERROR', 'Failed to index generated CV'));
    }
  }
}
