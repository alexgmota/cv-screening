import { Entity } from '../shared/entity';

interface CvEmbeddingProps {
  cvId: string;
  chunkText: string;
  chunkIndex: number;
  embedding: number[];
  createdAt: Date;
}

export class CvEmbedding extends Entity<CvEmbeddingProps> {
  get cvId(): string {
    return this.props.cvId;
  }

  get chunkText(): string {
    return this.props.chunkText;
  }

  get chunkIndex(): number {
    return this.props.chunkIndex;
  }

  get embedding(): number[] {
    return [...this.props.embedding];
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  static create(data: Omit<CvEmbeddingProps, 'createdAt'>): CvEmbedding {
    return new CvEmbedding({
      ...data,
      createdAt: new Date(),
    });
  }
}
