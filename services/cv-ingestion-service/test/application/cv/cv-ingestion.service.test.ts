import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CvIngestionService } from '../../../src/application/cv/cv-ingestion.service';
import { DomainError } from '../../../src/domain/shared/app-error';

function createMockGemini() {
  return {
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2]),
    generateEmbeddings: vi.fn().mockResolvedValue([[0.1, 0.2], [0.3, 0.4]]),
    generateContent: vi.fn(),
  } as any;
}

function createMockCvRepo() {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    save: vi.fn().mockResolvedValue(undefined),
  } as any;
}

function createMockEmbeddingRepo() {
  return {
    findById: vi.fn(),
    findByCvId: vi.fn(),
    save: vi.fn(),
    saveBatch: vi.fn().mockResolvedValue(undefined),
    searchSimilar: vi.fn(),
  } as any;
}

function createMockChunker() {
  return {
    chunk: vi.fn().mockReturnValue(['chunk one', 'chunk two']),
  } as any;
}

function createMockPdfExtractor() {
  return {
    extract: vi.fn().mockResolvedValue('Jane Smith\nFrontend Developer\nsummary text'),
  } as any;
}

function createMockMetadataExtractor() {
  return {
    extractMetadata: vi.fn().mockResolvedValue({
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '123-456-7890',
      role: 'Frontend Developer',
      summary: 'summary text',
      skills: ['React', 'TypeScript'],
      education: [{ institution: 'U', degree: 'BS', field: 'CS', startDate: '2016' }],
      experience: [{ company: 'Co', position: 'Dev', startDate: '2020', description: 'built things' }],
    }),
  } as any;
}

function createMockStorage() {
  return {
    read: vi.fn().mockResolvedValue(Buffer.from('pdf-buffer')),
  } as any;
}

describe('CvIngestionService', () => {
  let gemini: ReturnType<typeof createMockGemini>;
  let cvRepo: ReturnType<typeof createMockCvRepo>;
  let embRepo: ReturnType<typeof createMockEmbeddingRepo>;
  let chunker: ReturnType<typeof createMockChunker>;
  let pdfExtractor: ReturnType<typeof createMockPdfExtractor>;
  let metadataExtractor: ReturnType<typeof createMockMetadataExtractor>;
  let storage: ReturnType<typeof createMockStorage>;
  let service: CvIngestionService;

  beforeEach(() => {
    gemini = createMockGemini();
    cvRepo = createMockCvRepo();
    embRepo = createMockEmbeddingRepo();
    chunker = createMockChunker();
    pdfExtractor = createMockPdfExtractor();
    metadataExtractor = createMockMetadataExtractor();
    storage = createMockStorage();
    service = new CvIngestionService(gemini, {
      run: vi.fn(async (work) => work({ cvRepository: cvRepo, embeddingRepository: embRepo })),
    }, chunker, pdfExtractor, metadataExtractor, storage);
  });

  it('reads PDF, extracts text and metadata, saves CV and embeddings', async () => {
    const cv = await service.ingest('cvs/test.pdf', 'req-1');

    expect(storage.read).toHaveBeenCalledWith('cvs/test.pdf');
    expect(pdfExtractor.extract).toHaveBeenCalled();
    expect(metadataExtractor.extractMetadata).toHaveBeenCalledWith('Jane Smith\nFrontend Developer\nsummary text');
    expect(chunker.chunk).toHaveBeenCalledWith('Jane Smith\nFrontend Developer\nsummary text');
    expect(gemini.generateEmbeddings).toHaveBeenCalledWith(['chunk one', 'chunk two']);
    expect(cvRepo.save).toHaveBeenCalledWith(cv);
    expect(embRepo.saveBatch).toHaveBeenCalled();

    expect(cv.name).toBe('Jane Smith');
    expect(cv.email).toBe('jane@example.com');
    expect(cv.phone).toBe('123-456-7890');
    expect(cv.role).toBe('Frontend Developer');
    expect(cv.summary).toBe('summary text');
    expect(cv.pdfPath).toBe('cvs/test.pdf');
    expect(cv.photoPath).toBeUndefined();

    const savedEmbeddings = embRepo.saveBatch.mock.calls[0][0];
    expect(savedEmbeddings).toHaveLength(2);
    expect(savedEmbeddings[0].cvId).toBe(cv.id);
    expect(savedEmbeddings[0].chunkIndex).toBe(0);
    expect(savedEmbeddings[0].chunkText).toBe('chunk one');
    expect(savedEmbeddings[1].chunkIndex).toBe(1);
    expect(savedEmbeddings[1].chunkText).toBe('chunk two');
  });

  it('does not save embeddings when chunks are empty', async () => {
    chunker.chunk.mockReturnValue([]);
    gemini.generateEmbeddings.mockResolvedValue([]);

    const cv = await service.ingest('cvs/empty.pdf');

    expect(cvRepo.save).toHaveBeenCalledWith(cv);
    expect(embRepo.saveBatch).not.toHaveBeenCalled();
  });

  it('throws EXTRACTION_FAILED when PDF text extraction fails', async () => {
    pdfExtractor.extract.mockRejectedValue(new Error('bad pdf'));

    await expect(service.ingest('cvs/bad.pdf')).rejects.toMatchObject({ code: 'EXTRACTION_FAILED' });
    expect(cvRepo.save).not.toHaveBeenCalled();
    expect(embRepo.saveBatch).not.toHaveBeenCalled();
  });

  it('throws EXTRACTION_FAILED when metadata extraction fails and prevents save', async () => {
    metadataExtractor.extractMetadata.mockRejectedValue(new Error('no json'));

    await expect(service.ingest('cvs/test.pdf')).rejects.toMatchObject({ code: 'EXTRACTION_FAILED' });
    expect(cvRepo.save).not.toHaveBeenCalled();
    expect(embRepo.saveBatch).not.toHaveBeenCalled();
  });

  it('throws STORAGE_ERROR when storage read fails', async () => {
    storage.read.mockRejectedValue(new Error('file missing'));

    await expect(service.ingest('cvs/missing.pdf')).rejects.toMatchObject({ code: 'STORAGE_ERROR' });
    expect(pdfExtractor.extract).not.toHaveBeenCalled();
    expect(cvRepo.save).not.toHaveBeenCalled();
  });

  it('throws STORAGE_ERROR when atomic save fails', async () => {
    cvRepo.save.mockRejectedValue(new Error('DB down'));

    await expect(service.ingest('cvs/test.pdf')).rejects.toMatchObject({ code: 'STORAGE_ERROR' });
  });

  it('throws EMBEDDING_FAILED when embeddings fail', async () => {
    gemini.generateEmbeddings.mockRejectedValue(new Error('API down'));

    await expect(service.ingest('cvs/test.pdf')).rejects.toMatchObject({ code: 'EMBEDDING_FAILED' });
  });

  it('does not write anything when embedding generation fails', async () => {
    gemini.generateEmbeddings.mockRejectedValue(new Error('429 Too Many Requests'));

    await expect(service.ingest('cvs/test.pdf')).rejects.toMatchObject({ code: 'EMBEDDING_FAILED' });
    expect(cvRepo.save).not.toHaveBeenCalled();
    expect(embRepo.saveBatch).not.toHaveBeenCalled();
  });
});
