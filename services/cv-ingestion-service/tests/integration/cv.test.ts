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
    it('should return 400 when cv payload is missing', async () => {
      const res = await request(app)
        .post('/api/cvs/index')
        .send({ cv: '', text: 'Some CV text.' })
        .expect(400);

      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body).toHaveProperty('status', 'error');
      expect(mockIngestionUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 400 when text is missing', async () => {
      const res = await request(app)
        .post('/api/cvs/index')
        .send({ cv: { name: 'Jane Smith', role: 'Frontend Developer' }, text: '' })
        .expect(400);

      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body).toHaveProperty('status', 'error');
      expect(mockIngestionUseCase.execute).not.toHaveBeenCalled();
    });

    it('should return 202 with indexed status when ingestion succeeds', async () => {
      mockIngestionUseCase.execute.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/cvs/index')
        .send({
          cv: {
            name: 'Jane Smith',
            role: 'Frontend Developer',
            skills: ['React', 'TypeScript'],
            education: [],
            experience: [],
          },
          text: 'Jane Smith is a Frontend Developer skilled in React and TypeScript.',
        })
        .expect(202);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('status', 'indexed');
      expect(mockIngestionUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockIngestionUseCase.execute.mock.calls[0][0]).toEqual(
        expect.objectContaining({
          text: 'Jane Smith is a Frontend Developer skilled in React and TypeScript.',
        })
      );
    });

    it('should return 500 when ingestion fails', async () => {
      mockIngestionUseCase.execute.mockRejectedValue(new Error('DB down'));

      const res = await request(app)
        .post('/api/cvs/index')
        .send({
          cv: { name: 'Jane Smith', role: 'Frontend Developer' },
          text: 'Jane Smith is a Frontend Developer.',
        })
        .expect(500);

      expect(res.body).toHaveProperty('code', 'STORAGE_ERROR');
      expect(res.body).toHaveProperty('status', 'error');
    });
  });
});