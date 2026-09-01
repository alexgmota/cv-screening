import { describe, it, expect, vi } from 'vitest';
import { UnitOfWorkImpl } from '../../../src/infrastructure/database/unit-of-work.impl';
import { CvEntity } from '../../../src/domain/cv/cv.entity';
import { CvEmbedding } from '../../../src/domain/cv/cv-embedding.entity';

describe('UnitOfWorkImpl', () => {
  it('rolls back CV and embeddings when an insert fails', async () => {
    const client = {
      query: vi.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('embedding insert failed'))
        .mockResolvedValueOnce({}),
      release: vi.fn(),
    };
    const pool = { connect: vi.fn().mockResolvedValue(client) } as any;
    const unitOfWork = new UnitOfWorkImpl(pool);
    const cv = CvEntity.create({
      name: 'Jane',
      role: 'Designer',
      skills: [],
      education: [],
      experience: [],
    });
    const embedding = CvEmbedding.create({
      cvId: cv.id,
      chunkText: 'Jane is a designer',
      chunkIndex: 0,
      embedding: [0.1, 0.2],
    });

    await expect(unitOfWork.run(async ({ cvRepository, embeddingRepository }) => {
      await cvRepository.save(cv);
      await embeddingRepository.saveBatch([embedding]);
    })).rejects.toThrow('embedding insert failed');

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(4, 'ROLLBACK');
    expect(client.query).not.toHaveBeenCalledWith('COMMIT');
    expect(client.release).toHaveBeenCalledOnce();
  });
});