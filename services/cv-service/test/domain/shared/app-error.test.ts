import { describe, it, expect } from 'vitest';
import { DomainError } from '../../../src/domain/shared/app-error';

describe('DomainError', () => {
  it('creates an error with code, message, and details', () => {
    const err = new DomainError('VALIDATION_ERROR', 'Invalid input', { field: 'name' });

    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.message).toBe('Invalid input');
    expect(err.details).toEqual({ field: 'name' });
    expect(err.name).toBe('DomainError');
    expect(err.timestamp).toBeDefined();
    expect(err).toBeInstanceOf(Error);
  });

  it('creates an error without details', () => {
    const err = new DomainError('NOT_FOUND', 'CV not found');

    expect(err.details).toBeUndefined();
  });

  it('toResponse returns a formatted AppError object', () => {
    const err = new DomainError('LLM_UNAVAILABLE', 'Model down');
    const response = err.toResponse('req-123');

    expect(response).toEqual({
      status: 'error',
      code: 'LLM_UNAVAILABLE',
      message: 'Model down',
      details: undefined,
      timestamp: err.timestamp,
      requestId: 'req-123',
    });
  });

  it('toResponse without requestId omits it', () => {
    const err = new DomainError('EMBEDDING_FAILED', 'embed failed');
    const response = err.toResponse();

    expect(response.requestId).toBeUndefined();
  });
});
