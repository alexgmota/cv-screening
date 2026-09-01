import { CvEntity } from './cv.entity';
import { CvEmbedding } from './cv-embedding.entity';

export interface ICvRepository {
  save(cv: CvEntity): Promise<void>;
}

export interface IEmbeddingRepository {
  save(embedding: CvEmbedding): Promise<void>;
  saveBatch(embeddings: CvEmbedding[]): Promise<void>;
}
