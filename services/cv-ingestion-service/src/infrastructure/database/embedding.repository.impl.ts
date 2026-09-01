import { Pool } from 'pg';
import { CvEmbedding } from '../../domain/cv/cv-embedding.entity';
import { IEmbeddingRepository } from '../../domain/cv/cv.repository';

export class EmbeddingRepositoryImpl implements IEmbeddingRepository {
  constructor(private readonly pool: Pick<Pool, 'query'>) {}

  async save(embedding: CvEmbedding): Promise<void> {
    await this.pool.query(
      `INSERT INTO cv_embeddings (id, cv_id, chunk_text, chunk_index, embedding, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         cv_id = EXCLUDED.cv_id,
         chunk_text = EXCLUDED.chunk_text,
         chunk_index = EXCLUDED.chunk_index,
         embedding = EXCLUDED.embedding`,
      [
        embedding.id,
        embedding.cvId,
        embedding.chunkText,
        embedding.chunkIndex,
        this.vectorToString(embedding.embedding),
        embedding.createdAt,
      ]
    );
  }

  async saveBatch(embeddings: CvEmbedding[]): Promise<void> {
    for (const embedding of embeddings) {
      await this.pool.query(
          `INSERT INTO cv_embeddings (id, cv_id, chunk_text, chunk_index, embedding, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (id) DO UPDATE SET
             cv_id = EXCLUDED.cv_id,
             chunk_text = EXCLUDED.chunk_text,
             chunk_index = EXCLUDED.chunk_index,
             embedding = EXCLUDED.embedding`,
          [
            embedding.id,
            embedding.cvId,
            embedding.chunkText,
            embedding.chunkIndex,
            this.vectorToString(embedding.embedding),
            embedding.createdAt,
          ]
        );
    }
  }

  private vectorToString(vector: number[]): string {
    return `[${vector.join(',')}]`;
  }
}