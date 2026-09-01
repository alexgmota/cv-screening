import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmbeddingRepositoryImpl } from '../../../src/infrastructure/database/embedding.repository.impl';
import { CvEmbedding } from '../../../src/domain/cv/cv-embedding.entity';

function createMockPool() {
  return {
    query: vi.fn(),
    connect: vi.fn(),
  } as any;
}

describe('EmbeddingRepositoryImpl', () => {
  let pool: ReturnType<typeof createMockPool>;
  let repo: EmbeddingRepositoryImpl;

  beforeEach(() => {
    pool = createMockPool();
    repo = new EmbeddingRepositoryImpl(pool);
  });

  describe('save', () => {
    it('inserts embedding with correct parameters', async () => {
      pool.query.mockResolvedValue({});
      const emb = CvEmbedding.create({
        cvId: 'cv-1',
        chunkText: 'test',
        chunkIndex: 0,
        embedding: [0.5, 0.6],
      });

      await repo.save(emb);

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(sql).toContain('INSERT INTO cv_embeddings');
      expect(params[0]).toBe(emb.id);
      expect(params[3]).toBe(0);
    });
  });

  describe('saveBatch', () => {
    it('inserts all embeddings through the provided connection', async () => {
      pool.query.mockResolvedValue({});
      const emb = CvEmbedding.create({
        cvId: 'cv-1',
        chunkText: 'test',
        chunkIndex: 0,
        embedding: [0.1],
      });

      await repo.saveBatch([emb]);

      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(pool.query.mock.calls[0][0]).toContain('INSERT INTO cv_embeddings');
    });

    it('propagates insert errors to the Unit of Work', async () => {
      pool.query.mockRejectedValue(new Error('Insert failed'));
      const emb = CvEmbedding.create({
        cvId: 'cv-1',
        chunkText: 'test',
        chunkIndex: 0,
        embedding: [0.1],
      });

      await expect(repo.saveBatch([emb])).rejects.toThrow();
    });
  });
});