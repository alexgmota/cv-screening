import { GeminiClient } from '../../infrastructure/gemini/gemini.client';
import { CvEntity } from '../../domain/cv/cv.entity';
import { CvEmbedding } from '../../domain/cv/cv-embedding.entity';
import { DomainError } from '../../domain/shared/app-error';
import { IUnitOfWork } from './unit-of-work';
import { PdfExtractorService } from '../../infrastructure/pdf/pdf-extractor.service';
import { CvMetadataExtractor } from '../../infrastructure/gemini/cv-metadata-extractor';
import { FileSystemStorage } from '../../infrastructure/storage/file-system.storage';

/**
 * Splits raw document text into discrete chunks for embedding.
 * Implemented by the infrastructure layer (see Task 15).
 */
export interface ITextChunker {
  chunk(text: string): string[];
}

/**
 * Application service that orchestrates the CV ingestion pipeline.
 * Reads a PDF, extracts its text, extracts structured CV metadata,
 * chunks the text, generates embeddings, and persists the CV and its embeddings.
 */
export class CvIngestionService {
  /**
   * @param geminiClient Gemini client used to generate embeddings.
   * @param unitOfWork Unit of work for atomic CV and embedding persistence.
   * @param chunker Chunker that splits extracted text into digestible chunks.
   * @param pdfExtractor Extractor that reads plain text from PDF buffers.
   * @param metadataExtractor Extractor that derives structured CV metadata from text.
   * @param storage File-system storage that reads the PDF by path.
   */
  constructor(
    private readonly geminiClient: GeminiClient,
    private readonly unitOfWork: IUnitOfWork,
    private readonly chunker: ITextChunker,
    private readonly pdfExtractor: PdfExtractorService,
    private readonly metadataExtractor: CvMetadataExtractor,
    private readonly storage: FileSystemStorage
  ) {}

  /**
   * Ingests a CV: reads its PDF, extracts metadata, and persists
   * the CV and its chunk embeddings atomically.
   * @param pdfPath Path to the CV PDF relative to the storage root.
   * @param requestId Optional request identifier for error reporting.
   * @returns The created CV entity.
   * @throws DomainError when storage, extraction, or embedding fails.
   */
  async ingest(pdfPath: string, requestId?: string): Promise<CvEntity> {
    let buffer: Buffer;
    try {
      buffer = await this.storage.read(pdfPath);
    } catch (error) {
      throw new DomainError(
        'STORAGE_ERROR',
        'Failed to read CV PDF from storage',
        { requestId, pdfPath, cause: error }
      );
    }

    let text: string;
    try {
      text = await this.pdfExtractor.extract(buffer);
    } catch (error) {
      throw new DomainError(
        'EXTRACTION_FAILED',
        'Failed to extract text from CV PDF',
        { requestId, pdfPath, cause: error }
      );
    }

    let metadata;
    try {
      metadata = await this.metadataExtractor.extractMetadata(text);
    } catch (error) {
      throw new DomainError(
        'EXTRACTION_FAILED',
        'Failed to extract CV metadata',
        { requestId, pdfPath, cause: error }
      );
    }

    const cv = CvEntity.create({
      name: metadata.name,
      email: metadata.email || undefined,
      phone: metadata.phone || undefined,
      role: metadata.role,
      summary: metadata.summary,
      pdfPath,
      skills: metadata.skills,
      education: metadata.education,
      experience: metadata.experience,
    });

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

    return cv;
  }
}
