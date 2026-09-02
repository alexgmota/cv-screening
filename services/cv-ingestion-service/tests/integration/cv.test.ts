import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createMockIngestionUseCase, MockIngestionUseCase } from '../helpers/setup';

describe('CV Ingestion Endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let mockIngestionUseCase: MockIngestionUseCase;

  beforeEach(() => {
    mockIngestionUseCase = createMockIngestionUseCase();
    app = createTestApp({ ingestionUseCase: mockIngestionUseCase });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('POST /api/cvs/index', () => {
    it('should return 400 when pdfPath is missing', async () => {
      const res = await request(app)
        .post('/api/cvs/index')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body).toHaveProperty('status', 'error');
      expect(mockIngestionUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 400 when pdfPath is empty', async () => {
      const res = await request(app)
        .post('/api/cvs/index')
        .send({ pdfPath: '   ' })
        .expect(400);

      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body).toHaveProperty('status', 'error');
      expect(mockIngestionUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 202 with indexed status when ingestion succeeds', async () => {
      mockIngestionUseCase.execute.mockResolvedValue({ id: 'cv-123' });

      const res = await request(app)
        .post('/api/cvs/index')
        .send({ pdfPath: 'cvs/test.pdf' })
        .expect(202);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id', 'cv-123');
      expect(res.body.data).toHaveProperty('status', 'indexed');
      expect(mockIngestionUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockIngestionUseCase.execute.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          pdfPath: 'cvs/test.pdf',
        })
      );
    });

    it('should return 500 when ingestion fails', async () => {
      mockIngestionUseCase.execute.mockRejectedValue(new Error('DB down'));

      const res = await request(app)
        .post('/api/cvs/index')
        .send({ pdfPath: 'cvs/test.pdf' })
        .expect(500);

      expect(res.body).toHaveProperty('code', 'STORAGE_ERROR');
      expect(res.body).toHaveProperty('status', 'error');
    });
  });
});
