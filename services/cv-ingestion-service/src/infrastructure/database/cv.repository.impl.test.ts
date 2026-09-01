import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CvRepositoryImpl } from './cv.repository.impl';
import { CvEntity } from '../../domain/cv/cv.entity';

function createMockPool() {
  return {
    query: vi.fn(),
    connect: vi.fn(),
  } as any;
}

describe('CvRepositoryImpl', () => {
  let pool: ReturnType<typeof createMockPool>;
  let repo: CvRepositoryImpl;

  beforeEach(() => {
    pool = createMockPool();
    repo = new CvRepositoryImpl(pool);
  });

  describe('save', () => {
    it('calls pool.query with correct parameters', async () => {
      pool.query.mockResolvedValue({});
      const cv = CvEntity.create({
        name: 'Jane',
        email: 'jane@test.com',
        role: 'Designer',
        skills: ['Figma'],
        education: [],
        experience: [],
      });

      await repo.save(cv);

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO cvs');
      expect(params[0]).toBe(cv.id);
      expect(params[1]).toBe('Jane');
      expect(params[2]).toBe('jane@test.com');
    });
  });

});