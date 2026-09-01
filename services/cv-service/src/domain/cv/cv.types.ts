import { CvEntity, Education, Experience } from './cv.entity';
import { CvEmbedding } from './cv-embedding.entity';
import { SimilarChunk } from './cv.repository';

export { CvEntity, Education, Experience } from './cv.entity';
export { CvEmbedding } from './cv-embedding.entity';
export { ICvRepository, IEmbeddingRepository, SimilarChunk } from './cv.repository';

export interface CvMetadata {
  id: string;
  name: string;
  email?: string;
  role: string;
  skills: string[];
  createdAt: Date;
}

export interface CvListResponse {
  cvs: CvMetadata[];
}

export interface CvGenerateRequest {
  count: number;
}

export interface CvGenerateResponse {
  status: 'accepted';
  jobId: string;
  message: string;
}