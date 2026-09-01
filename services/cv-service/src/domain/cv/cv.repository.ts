import { CvEntity } from './cv.entity';
import { CvEmbedding } from './cv-embedding.entity';

export interface SimilarChunk {
  embedding: CvEmbedding;
  cv: CvEntity;
  similarity: number;
}

export interface ICvRepository {
  findById(id: string): Promise<CvEntity | null>;
  findAll(): Promise<CvEntity[]>;
}

export interface IEmbeddingRepository {
  searchSimilar(vector: number[], limit: number): Promise<SimilarChunk[]>;
}
