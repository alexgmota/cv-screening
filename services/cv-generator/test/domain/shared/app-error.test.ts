import { describe, it, expect } from 'vitest';
import { CvDomainError } from '../../../src/domain/shared/app-error';

describe('CvDomainError', () => {
  it('creates error with code and message', () => {
    const err = new CvDomainError('CV_GENERATION_FAILED', 'failed', { detail: 1 });

    expect(err.code).toBe('CV_GENERATION_FAILED');
    expect(err.message).toBe('failed');
    expect(err.details).toEqual({ detail: 1 });
    expect(err.name).toBe('CvDomainError');
    expect(err).toBeInstanceOf(Error);
  });

  it('static generationFailed factory', () => {
    const err = CvDomainError.generationFailed({ prompt: 'test' });
    expect(err.code).toBe('CV_GENERATION_FAILED');
    expect(err.message).toBe('Failed to generate CV data from LLM');
  });

  it('static pdfRenderingFailed factory', () => {
    const err = CvDomainError.pdfRenderingFailed();
    expect(err.code).toBe('PDF_RENDERING_ERROR');
    expect(err.message).toBe('Failed to render CV data to PDF');
  });

  it('static llmUnavailable factory', () => {
    const err = CvDomainError.llmUnavailable();
    expect(err.code).toBe('LLM_UNAVAILABLE');
  });

  it('static photoFetchFailed factory', () => {
    const err = CvDomainError.photoFetchFailed();
    expect(err.code).toBe('PHOTO_FETCH_FAILED');
  });

  it('static storageError factory', () => {
    const err = CvDomainError.storageError();
    expect(err.code).toBe('STORAGE_ERROR');
  });

  it('toResponse returns formatted object', () => {
    const err = CvDomainError.generationFailed();
    const response = err.toResponse('req-1');

    expect(response).toEqual({
      status: 'error',
      code: 'CV_GENERATION_FAILED',
      message: 'Failed to generate CV data from LLM',
      details: undefined,
      timestamp: err.timestamp,
      requestId: 'req-1',
    });
  });

  it('toResponse without requestId', () => {
    const err = CvDomainError.storageError();
    const response = err.toResponse();
    expect(response.requestId).toBeUndefined();
  });
});
