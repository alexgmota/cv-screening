export type CvGeneratorErrorCode =
  | 'CV_GENERATION_FAILED'
  | 'PDF_RENDERING_ERROR'
  | 'LLM_UNAVAILABLE'
  | 'PHOTO_FETCH_FAILED'
  | 'STORAGE_ERROR'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'STORAGE_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

/** Domain errors specific to the CV Generator service. */
export class CvDomainError extends Error {
  public readonly code: CvGeneratorErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(code: CvGeneratorErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'CvDomainError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  static generationFailed(details?: unknown): CvDomainError {
    return new CvDomainError(
      'CV_GENERATION_FAILED',
      'Failed to generate CV data from LLM',
      details
    );
  }

  static pdfRenderingFailed(details?: unknown): CvDomainError {
    return new CvDomainError(
      'PDF_RENDERING_ERROR',
      'Failed to render CV data to PDF',
      details
    );
  }

  static llmUnavailable(details?: unknown): CvDomainError {
    return new CvDomainError(
      'LLM_UNAVAILABLE',
      'LLM service is unavailable',
      details
    );
  }

  static photoFetchFailed(details?: unknown): CvDomainError {
    return new CvDomainError(
      'PHOTO_FETCH_FAILED',
      'Failed to fetch candidate photo',
      details
    );
  }

  static storageError(details?: unknown): CvDomainError {
    return new CvDomainError(
      'STORAGE_ERROR',
      'File storage operation failed',
      details
    );
  }

  toResponse(requestId?: string): {
    status: 'error';
    code: CvGeneratorErrorCode;
    message: string;
    details?: unknown;
    timestamp: string;
    requestId?: string;
  } {
    return {
      status: 'error',
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      requestId,
    };
  }
}
