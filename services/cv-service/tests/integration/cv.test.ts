import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createMockCvRepository, MockCvRepository } from '../helpers/setup';
import { CvEntity } from '../../src/domain/cv/cv.entity';

function createTestCv(overrides?: Partial<{ id: string; name: string; role: string; email: string }>): CvEntity {
  return new CvEntity(
    {
      name: overrides?.name ?? 'Jane Smith',
      email: overrides?.email ?? 'jane@example.com',
      phone: '+1234567890',
      role: overrides?.role ?? 'Frontend Developer',
      photoPath: '/photos/test.jpg',
      pdfPath: '/pdfs/test.pdf',
      skills: ['React', 'TypeScript'],
      education: [
        {
          institution: 'MIT',
          degree: 'BS',
          field: 'Computer Science',
          startDate: '2016-09',
          endDate: '2020-05',
        },
      ],
      experience: [
        {
          company: 'Tech Corp',
          position: 'Frontend Developer',
          startDate: '2020-06',
          description: 'Built web apps',
        },
      ],
      createdAt: new Date('2025-01-01'),
    },
    overrides?.id ?? 'cv-test-001'
  );
}

describe('CV Endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let mockCvRepo: MockCvRepository;

  beforeEach(() => {
    mockCvRepo = createMockCvRepository();
    app = createTestApp({ cvRepository: mockCvRepo });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/cvs', () => {
    it('should return 200 with paginated CV list', async () => {
      const cvs = [createTestCv({ id: 'cv-1' }), createTestCv({ id: 'cv-2', name: 'Bob' })];
      mockCvRepo.findPage.mockResolvedValue({ data: cvs, total: 2 });

      const res = await request(app)
        .get('/api/cvs')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.total).toBe(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
    });

    it('should respect page and limit query parameters', async () => {
      const cvs = Array.from({ length: 2 }, (_, i) => createTestCv({ id: `cv-page2-${i}` }));
      mockCvRepo.findPage.mockResolvedValue({ data: cvs, total: 5 });

      const res = await request(app)
        .get('/api/cvs?page=2&limit=2')
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.page).toBe(2);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.total).toBe(5);
      expect(res.body.pagination.totalPages).toBe(3);
    });

    it('should cap limit at 100', async () => {
      mockCvRepo.findPage.mockResolvedValue({ data: [], total: 0 });

      const res = await request(app)
        .get('/api/cvs?limit=500')
        .expect(200);

      expect(res.body.pagination.limit).toBe(100);
    });

    it('should default to page 1 and limit 20', async () => {
      mockCvRepo.findPage.mockResolvedValue({ data: [], total: 0 });

      const res = await request(app)
        .get('/api/cvs')
        .expect(200);

      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(20);
    });

    it('should return empty data array when no CVs exist', async () => {
      mockCvRepo.findPage.mockResolvedValue({ data: [], total: 0 });

      const res = await request(app)
        .get('/api/cvs')
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.pagination.total).toBe(0);
    });

    it('should not expose sensitive fields like pdfPath or photoPath in list', async () => {
      const cv = createTestCv();
      mockCvRepo.findPage.mockResolvedValue({ data: [cv], total: 1 });

      const res = await request(app)
        .get('/api/cvs')
        .expect(200);

      expect(res.body.data[0]).not.toHaveProperty('pdfPath');
      expect(res.body.data[0]).not.toHaveProperty('photoPath');
    });

    it('should pass search query to findPage', async () => {
      mockCvRepo.findPage.mockResolvedValue({ data: [], total: 0 });

      await request(app)
        .get('/api/cvs?search=frontend')
        .expect(200);

      expect(mockCvRepo.findPage).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'frontend' })
      );
    });
  });

  describe('GET /api/cvs/:id', () => {
    it('should return 200 with full CV details', async () => {
      const cv = createTestCv({ id: 'cv-detail-1' });
      mockCvRepo.findById.mockResolvedValue(cv);

      const res = await request(app)
        .get('/api/cvs/cv-detail-1')
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.id).toBe('cv-detail-1');
      expect(res.body.data.name).toBe('Jane Smith');
      expect(res.body.data.role).toBe('Frontend Developer');
      expect(res.body.data).toHaveProperty('education');
      expect(res.body.data).toHaveProperty('experience');
      expect(res.body.data).toHaveProperty('skills');
      expect(res.body.data).toHaveProperty('photoPath');
      expect(res.body.data).toHaveProperty('pdfPath');
    });

    it('should return 404 when CV does not exist', async () => {
      mockCvRepo.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/cvs/non-existent-id')
        .expect(404);

      expect(res.body).toHaveProperty('code', 'NOT_FOUND');
      expect(res.body).toHaveProperty('status', 'error');
    });
  });
});