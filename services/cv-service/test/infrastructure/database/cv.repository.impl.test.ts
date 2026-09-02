import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CvRepositoryImpl } from '../../../src/infrastructure/database/cv.repository.impl';

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

  describe('findPage', () => {
    it('returns paginated results without search', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: 3 }] })
        .mockResolvedValueOnce({
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

      const result = await repo.findPage({ limit: 10, offset: 0 });
      expect(result.total).toBe(3);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe('A');
    });

    it('returns empty results when no rows match', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await repo.findPage({ limit: 10, offset: 0 });
      expect(result.total).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('filters by search term using ILIKE', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: 1 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'cv-2',
              name: 'Jane',
              email: null,
              phone: null,
              role: 'Frontend Developer',
              photo_path: null,
              pdf_path: null,
              skills: [],
              education: [],
              experience: [],
              created_at: new Date(),
            },
          ],
        });

      const result = await repo.findPage({ search: 'frontend', limit: 10, offset: 0 });
      expect(result.total).toBe(1);
      expect(result.data).toHaveLength(1);

      expect(pool.query).toHaveBeenNthCalledWith(1,
        'SELECT COUNT(*)::int AS count FROM cvs WHERE name ILIKE $1 OR role ILIKE $1',
        ['%frontend%']
      );
      expect(pool.query).toHaveBeenNthCalledWith(2,
        'SELECT * FROM cvs WHERE name ILIKE $1 OR role ILIKE $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        ['%frontend%', 10, 0]
      );
    });

    it('ignores whitespace-only search', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: 2 }] })
        .mockResolvedValueOnce({ rows: [] });

      await repo.findPage({ search: '   ', limit: 10, offset: 0 });

      expect(pool.query).toHaveBeenNthCalledWith(1,
        'SELECT COUNT(*)::int AS count FROM cvs'
      );
    });

    it('uses correct limit and offset', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ count: 50 }] })
        .mockResolvedValueOnce({ rows: [] });

      await repo.findPage({ limit: 5, offset: 10 });

      expect(pool.query).toHaveBeenNthCalledWith(2,
        'SELECT * FROM cvs ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [5, 10]
      );
    });
  });
});
