import { GeminiClient } from '../../infrastructure/gemini/gemini.client';
import { CvEntity } from '../../domain/cv/cv.entity';
import { CvEmbedding } from '../../domain/cv/cv-embedding.entity';
import { DomainError } from '../../domain/shared/app-error';
import { IUnitOfWork } from './unit-of-work';

/**
 * Splits raw document text into discrete chunks for embedding.
 * Implemented by the infrastructure layer (see Task 15).
 */
export interface ITextChunker {
  chunk(text: string): string[];
}

/**
 * Application service that orchestrates the CV ingestion pipeline.
 * Extracts structured CV data, chunks its text, generates embeddings,
 * and persists both the CV and its embeddings.
 */
export class CvIngestionService {
  /**
   * @param geminiClient Gemini client used to generate embeddings.
   * @param cvRepository Repository for persisting CV entities.
   * @param embeddingRepository Repository for persisting embeddings.
   * @param chunker Chunker that splits extracted text into digestible chunks.
   */
  constructor(
    private readonly geminiClient: GeminiClient,
    private readonly unitOfWork: IUnitOfWork,
    private readonly chunker: ITextChunker
  ) {}

  /**
   * Ingests a CV: persists its metadata and embeds each text chunk.
   * @param cv The CV entity to persist.
   * @param text The raw extracted text belonging to the CV.
   * @param requestId Optional request identifier for error reporting.
   * @throws DomainError when storage or embedding fails.
   */
  async ingest(cv: CvEntity, text: string, requestId?: string): Promise<void> {
    const chunks = this.chunker.chunk(text);

    let embeddings: number[][];
    try {
      embeddings = await this.geminiClient.generateEmbeddings(chunks);
    } catch (error) {
      throw new DomainError(
        'EMBEDDING_FAILED',
        'Failed to generate embeddings for CV chunks',
        { requestId, cvId: cv.id, cause: error }
      );
    }

    const cvEmbeddings = embeddings.map(
      (embedding, index) =>
        CvEmbedding.create({
          cvId: cv.id,
          chunkText: chunks[index],
          chunkIndex: index,
          embedding,
        })
    );

    try {
      await this.unitOfWork.run(async ({ cvRepository, embeddingRepository }) => {
        await cvRepository.save(cv);
        if (cvEmbeddings.length > 0) {
          await embeddingRepository.saveBatch(cvEmbeddings);
        }
      });
    } catch (error) {
      throw new DomainError(
        'STORAGE_ERROR',
        'Failed to store CV and embeddings',
        { requestId, cvId: cv.id, cause: error }
      );
    }
  }
}