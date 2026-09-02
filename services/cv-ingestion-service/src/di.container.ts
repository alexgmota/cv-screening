import { createContainer, asFunction, asValue, InjectionMode } from 'awilix';
import { CvIngestionService } from './application/cv/cv-ingestion.service';
import { CvIngestionUseCase } from './application/cv/cv-ingestion.use-case';
import { getPool } from './infrastructure/database/postgres';
import { UnitOfWorkImpl } from './infrastructure/database/unit-of-work.impl';
import { TextChunkerService } from './infrastructure/pdf/text-chunker.service';
import { PdfExtractorService } from './infrastructure/pdf/pdf-extractor.service';
import { GeminiClient } from './infrastructure/gemini/gemini.client';
import { CvMetadataExtractor } from './infrastructure/gemini/cv-metadata-extractor';
import { FileSystemStorage } from './infrastructure/storage/file-system.storage';

export const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

container.register({
  pool: asFunction(getPool).singleton(),
  unitOfWork: asFunction((pool) => new UnitOfWorkImpl(pool)).singleton(),
  geminiClient: asFunction(() => new GeminiClient(undefined, {
    maxRetries: parseInt(process.env.GEMINI_RETRY_MAX || '3', 10),
    baseDelayMs: parseInt(process.env.GEMINI_RETRY_BASE_DELAY_MS || '250', 10),
    maxDelayMs: parseInt(process.env.GEMINI_RETRY_MAX_DELAY_MS || '8000', 10),
  })).singleton(),
  chunker: asFunction(() => new TextChunkerService({
    maxTokens: parseInt(process.env.CHUNK_SIZE || '512', 10),
    overlapTokens: parseInt(process.env.CHUNK_OVERLAP || '50', 10),
  })).transient(),
  storageRoot: asValue(process.env.DATA_VOLUME_PATH || '/data/cvs'),
  pdfStorage: asFunction((storageRoot) => new FileSystemStorage(storageRoot)).singleton(),
  pdfExtractor: asFunction(() => new PdfExtractorService()).transient(),
  metadataExtractor: asFunction((geminiClient) => new CvMetadataExtractor(geminiClient)).transient(),
  cvIngestionService: asFunction((geminiClient, unitOfWork, chunker, pdfExtractor, metadataExtractor, pdfStorage) =>
    new CvIngestionService(geminiClient, unitOfWork, chunker, pdfExtractor, metadataExtractor, pdfStorage)
  ).transient(),
  cvIngestionUseCase: asFunction((cvIngestionService) =>
    new CvIngestionUseCase(cvIngestionService)
  ).transient(),
});
