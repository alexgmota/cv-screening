/** Error codes for application errors */
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CV_GENERATION_FAILED = 'CV_GENERATION_FAILED',
  PDF_RENDERING_ERROR = 'PDF_RENDERING_ERROR',
  PHOTO_FETCH_FAILED = 'PHOTO_FETCH_FAILED',
  LLM_UNAVAILABLE = 'LLM_UNAVAILABLE',
  EMBEDDING_FAILED = 'EMBEDDING_FAILED',
  STORAGE_ERROR = 'STORAGE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  PDF_EXTRACTION_FAILED = 'PDF_EXTRACTION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/** HTTP status codes for error responses */
export enum HttpStatusCode {
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

/** Map error codes to HTTP status codes */
export const ERROR_STATUS_MAP: Record<ErrorCode, HttpStatusCode> = {
  [ErrorCode.VALIDATION_ERROR]: HttpStatusCode.BAD_REQUEST,
  [ErrorCode.NOT_FOUND]: HttpStatusCode.NOT_FOUND,
  [ErrorCode.CV_GENERATION_FAILED]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCode.PDF_RENDERING_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCode.PHOTO_FETCH_FAILED]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCode.LLM_UNAVAILABLE]: HttpStatusCode.SERVICE_UNAVAILABLE,
  [ErrorCode.EMBEDDING_FAILED]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCode.STORAGE_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCode.DATABASE_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCode.PDF_EXTRACTION_FAILED]: HttpStatusCode.INTERNAL_SERVER_ERROR,
  [ErrorCode.INTERNAL_ERROR]: HttpStatusCode.INTERNAL_SERVER_ERROR
};

/** Application error interface */
export interface AppError {
  status: 'error';
  code: ErrorCode;
  message: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

/** Create an AppError instance */
export function createAppError(
  code: ErrorCode,
  message: string,
  details?: unknown,
  requestId?: string
): AppError {
  return {
    status: 'error',
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId
  };
}

/** Custom error class for application errors */
export class ApplicationError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatusCode;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown,
    requestId?: string
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.statusCode = ERROR_STATUS_MAP[code];
    this.details = details;
    this.requestId = requestId;
  }

  /** Convert to AppError interface */
  toJSON(): AppError {
    return createAppError(this.code, this.message, this.details, this.requestId);
  }
}
