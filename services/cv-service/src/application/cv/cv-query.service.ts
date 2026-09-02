import { CvEntity } from '../../domain/cv/cv.entity';
import {
  CvPageResult,
  ICvRepository,
  IEmbeddingRepository,
  SimilarChunk,
} from '../../domain/cv/cv.repository';

export interface ICvQueryService {
  findById(id: string): Promise<CvEntity | null>;
  findAll(): Promise<CvEntity[]>;
  findPage(params: { search?: string; limit: number; offset: number }): Promise<CvPageResult>;
  searchSimilar(vector: number[], limit: number): Promise<SimilarChunk[]>;
}

export class CvQueryService implements ICvQueryService {
  constructor(
    private readonly cvRepository: Pick<ICvRepository, 'findById' | 'findAll' | 'findPage'>,
    private readonly embeddingRepository: Pick<IEmbeddingRepository, 'searchSimilar'>
  ) {}

  async findById(id: string): Promise<CvEntity | null> {
    return this.cvRepository.findById(id);
  }

  async findAll(): Promise<CvEntity[]> {
    return this.cvRepository.findAll();
  }

  async findPage(params: { search?: string; limit: number; offset: number }): Promise<CvPageResult> {
    return this.cvRepository.findPage(params);
  }

  async searchSimilar(vector: number[], limit: number): Promise<SimilarChunk[]> {
    return this.embeddingRepository.searchSimilar(vector, limit);
  }
}
