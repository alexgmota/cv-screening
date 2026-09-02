export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'CV_GENERATION_FAILED'
  | 'LLM_UNAVAILABLE'
  | 'EMBEDDING_FAILED'
  | 'EXTRACTION_FAILED'
  | 'STORAGE_ERROR';

export interface AppError {
  status: 'error';
  code: ErrorCode;
  message: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

export class DomainError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly timestamp: string;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }

  toResponse(requestId?: string): AppError {
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
