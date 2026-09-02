import { Request, Response, NextFunction } from 'express';
import { DomainError, AppError } from '../../domain/shared/app-error';

/**
 * Express error-handling middleware.
 * Catches all errors and formats them into a standard AppError response.
 */
export function errorMiddleware(
  err: Error | DomainError | unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = (req as any).requestId as string | undefined;

  if (err instanceof DomainError) {
    console.error('[API] Request failed', {
      code: err.code,
      message: err.message,
      requestId,
      path: req.originalUrl,
      method: req.method,
      details: err.details,
      stack: err.stack,
    });
    res.status(getHttpStatus(err.code)).json(err.toResponse(requestId));
    return;
  }

  if (err instanceof Error) {
    console.error('[API] Unhandled error', {
      message: err.message,
      requestId,
      path: req.originalUrl,
      method: req.method,
      stack: err.stack,
    });
    const appError: AppError = {
      status: 'error',
      code: 'VALIDATION_ERROR',
      message: err.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      requestId,
    };
    res.status(500).json(appError);
    return;
  }

  console.error('[API] Unknown error', {
    requestId,
    path: req.originalUrl,
    method: req.method,
    error: err,
  });
  const appError: AppError = {
    status: 'error',
    code: 'VALIDATION_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId,
  };
  res.status(500).json(appError);
}

function getHttpStatus(code: string): number {
  const statusMap: Record<string, number> = {
    VALIDATION_ERROR: 400,
    NOT_FOUND: 404,
    LLM_UNAVAILABLE: 503,
    CV_GENERATION_FAILED: 500,
    EMBEDDING_FAILED: 500,
    EXTRACTION_FAILED: 500,
    STORAGE_ERROR: 500,
  };
  return statusMap[code] || 500;
}