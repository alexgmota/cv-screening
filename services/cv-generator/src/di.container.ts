import { createContainer, asFunction, asValue, InjectionMode } from 'awilix';
import { GeminiClient } from './infrastructure/gemini/gemini.client';
import { PhotoFetcherService } from './infrastructure/photo/photo-fetcher.service';
import { PdfRendererService } from './infrastructure/pdf/pdf-renderer.service';
import { FileSystemStorage } from './infrastructure/storage/file-system.storage';
import { CvData } from './domain/cv/cv-data.entity';
import type { ICvDataRepository } from './domain/cv/cv.repository';
import { CvGenerationService } from './application/generation/cv-generation.service';
import { GenerationUseCase } from './application/generation/cv-generation.use-case';

class InMemoryCvRepository implements ICvDataRepository {
  private readonly store = new Map<string, CvData>();

  async save(cvData: CvData): Promise<void> {
    this.store.set(cvData.id, cvData);
  }

  async findById(id: string): Promise<CvData | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<CvData[]> {
    return Array.from(this.store.values());
  }
}

export const container = createContainer({ injectionMode: InjectionMode.CLASSIC });

container.register({
  geminiClient: asFunction(() => new GeminiClient(
    process.env.GEMINI_API_KEY ?? '',
    process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  )).singleton(),
  storageRoot: asValue(process.env.CV_STORAGE_PATH || process.env.PDF_STORAGE_PATH || '/data/cvs'),
  photoFetcher: asFunction(() => new PhotoFetcherService()).transient(),
  pdfRenderer: asFunction((storageRoot) => new PdfRendererService(storageRoot)).transient(),
  storage: asFunction((storageRoot) => new FileSystemStorage(storageRoot)).singleton(),
  cvRepository: asFunction(() => new InMemoryCvRepository()).singleton(),
  geminiDelayMs: asValue(Number(process.env.CV_GENERATION_DELAY_MS) || 30000),
  generationService: asFunction((geminiClient, photoFetcher, pdfRenderer, storage, cvRepository, geminiDelayMs) =>
    new CvGenerationService(
      geminiClient,
      photoFetcher,
      pdfRenderer,
      storage,
      cvRepository,
      geminiDelayMs
    )
  ).singleton(),
  generationUseCase: asFunction((generationService) =>
    new GenerationUseCase(generationService)
  ).transient(),
});
