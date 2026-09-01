import { Request, Response, NextFunction } from 'express';
import { CvDomainError } from '../../domain/shared/app-error';

/**
 * Express error-handling middleware.
 * Catches all errors and formats them into a standard CvDomainError-shaped response.
 */
export function errorMiddleware(
  err: Error | CvDomainError | unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as Request & { requestId?: string }).requestId;

  if (err instanceof CvDomainError) {
    console.error('[cv-generator] domain error', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      code: err.code,
      message: err.message,
      details: err.details,
      stack: err.stack,
    });
    res.status(getHttpStatus(err.code)).json(err.toResponse(requestId));
    return;
  }

  if (err instanceof Error) {
    console.error('[cv-generator] unhandled error', {
      requestId,
      method: req.method,
      path: req.originalUrl,
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: err.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId,
    });
    return;
  }

  console.error('[cv-generator] unknown error', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    error: err,
  });
  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId,
  });
}

function getHttpStatus(code: string): number {
  const statusMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    NOT_FOUND: 404,
    LLM_UNAVAILABLE: 503,
    CV_GENERATION_FAILED: 500,
    PDF_RENDERING_ERROR: 500,
    PHOTO_FETCH_FAILED: 502,
    STORAGE_ERROR: 500,
  };
  return statusMap[code] || 500;
}