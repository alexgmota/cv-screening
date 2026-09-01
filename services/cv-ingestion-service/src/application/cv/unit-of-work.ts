import {
  ICvRepository,
  IEmbeddingRepository,
} from '../../domain/cv/cv.repository';

export interface UnitOfWorkRepositories {
  cvRepository: ICvRepository;
  embeddingRepository: IEmbeddingRepository;
}

export interface IUnitOfWork {
  run<T>(work: (repositories: UnitOfWorkRepositories) => Promise<T>): Promise<T>;
}