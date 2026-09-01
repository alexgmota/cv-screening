import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CvRepositoryImpl } from './cv.repository.impl';

function createMockPool() {
  return {
    query: vi.fn(),
  } as any;
}

describe('CvRepositoryImpl', () => {
  let pool: ReturnType<typeof createMockPool>;
  let repo: CvRepositoryImpl;

  beforeEach(() => {
    pool = createMockPool();
    repo = new CvRepositoryImpl(pool);
  });

  describe('findById', () => {
    it('returns null when no row found', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await repo.findById('missing-id');
      expect(result).toBeNull();
    });

    it('returns CvEntity when row found', async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            id: 'cv-1',
            name: 'John Doe',
            email: 'john@test.com',
            phone: '+123',
            role: 'Dev',
            photo_path: null,
            pdf_path: null,
            skills: ['React'],
            education: [],
            experience: [],
            created_at: new Date('2024-01-01'),
          },
        ],
      });

      const result = await repo.findById('cv-1');

      expect(result).not.toBeNull();
      expect(result!.name).toBe('John Doe');
      expect(result!.email).toBe('john@test.com');
      expect(result!.role).toBe('Dev');
      expect(result!.skills).toEqual(['React']);
    });

    it('passes correct query parameters', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await repo.findById('cv-123');
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM cvs WHERE id = $1', ['cv-123']);
    });
  });

  describe('findAll', () => {
    it('returns array of CvEntities', async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            id: 'cv-1',
            name: 'A',
            email: null,
            phone: null,
            role: 'Dev',
            photo_path: null,
            pdf_path: null,
            skills: [],
            education: [],
            experience: [],
            created_at: new Date(),
          },
        ],
      });

      const result = await repo.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('A');
    });

    it('returns empty array when no rows', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const result = await repo.findAll();
      expect(result).toEqual([]);
    });
  });
});
