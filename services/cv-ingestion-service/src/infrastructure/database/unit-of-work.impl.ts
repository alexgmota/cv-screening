import { Pool } from 'pg';
import { IUnitOfWork, UnitOfWorkRepositories } from '../../application/cv/unit-of-work';
import { CvRepositoryImpl } from './cv.repository.impl';
import { EmbeddingRepositoryImpl } from './embedding.repository.impl';

export class UnitOfWorkImpl implements IUnitOfWork {
  constructor(private readonly pool: Pool) {}

  async run<T>(work: (repositories: UnitOfWorkRepositories) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work({
        cvRepository: new CvRepositoryImpl(client),
        embeddingRepository: new EmbeddingRepositoryImpl(client),
      });
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}