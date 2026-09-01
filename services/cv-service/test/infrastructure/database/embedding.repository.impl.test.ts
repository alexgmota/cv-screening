import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbeddingRepositoryImpl } from '../../../src/infrastructure/database/embedding.repository.impl';

function createMockPool() {
  return {
    query: vi.fn(),
  } as any;
}

describe('EmbeddingRepositoryImpl', () => {
  let pool: ReturnType<typeof createMockPool>;
  let repo: EmbeddingRepositoryImpl;

  beforeEach(() => {
    pool = createMockPool();
    repo = new EmbeddingRepositoryImpl(pool);
  });

  describe('searchSimilar', () => {
    it('returns SimilarChunk array with CV data', async () => {
      pool.query.mockResolvedValue({
        rows: [
          {
            id: 'emb-1',
            cv_id: 'cv-1',
            chunk_text: 'React dev',
            chunk_index: 0,
            embedding: '[0.1,0.2]',
            created_at: new Date(),
            similarity: 0.95,
            cv_name: 'Alice',
            cv_email: 'alice@test.com',
            cv_phone: '+1',
            cv_role: 'Frontend',
            cv_photo_path: null,
            cv_pdf_path: null,
            cv_skills: ['React'],
            cv_education: [],
            cv_experience: [],
            cv_created_at: new Date(),
          },
        ],
      });

      const result = await repo.searchSimilar([0.1, 0.2], 5);

      expect(result).toHaveLength(1);
      expect(result[0].similarity).toBe(0.95);
      expect(result[0].cv.name).toBe('Alice');
      expect(result[0].cv.role).toBe('Frontend');
      expect(result[0].embedding.chunkText).toBe('React dev');
    });

    it('passes vector as string and limit', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      await repo.searchSimilar([0.1, 0.2, 0.3], 10);

      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('ORDER BY e.embedding <=>');
      expect(params[0]).toBe('[0.1,0.2,0.3]');
      expect(params[1]).toBe(10);
    });
  });
});
