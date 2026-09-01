import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CvIngestionService } from './cv-ingestion.service';
import { CvEntity } from '../../domain/cv/cv.entity';
import { DomainError } from '../../domain/shared/app-error';

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

describe('CvIngestionService', () => {
  let gemini: ReturnType<typeof createMockGemini>;
  let cvRepo: ReturnType<typeof createMockCvRepo>;
  let embRepo: ReturnType<typeof createMockEmbeddingRepo>;
  let chunker: ReturnType<typeof createMockChunker>;
  let service: CvIngestionService;

  beforeEach(() => {
    gemini = createMockGemini();
    cvRepo = createMockCvRepo();
    embRepo = createMockEmbeddingRepo();
    chunker = createMockChunker();
    service = new CvIngestionService(gemini, {
      run: vi.fn(async (work) => work({ cvRepository: cvRepo, embeddingRepository: embRepo })),
    }, chunker);
  });

  it('saves CV, chunks text, generates embeddings, and saves batch', async () => {
    const cv = CvEntity.create({
      name: 'Test',
      role: 'Dev',
      skills: [],
      education: [],
      experience: [],
    });

    await service.ingest(cv, 'Some CV text.', 'req-1');

    expect(chunker.chunk).toHaveBeenCalledWith('Some CV text.');
    expect(gemini.generateEmbeddings).toHaveBeenCalledWith(['chunk one', 'chunk two']);
    expect(cvRepo.save).toHaveBeenCalledWith(cv);
    expect(embRepo.saveBatch).toHaveBeenCalled();

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

    const cv = CvEntity.create({
      name: 'Empty',
      role: 'Dev',
      skills: [],
      education: [],
      experience: [],
    });

    await service.ingest(cv, '   ');

    expect(cvRepo.save).toHaveBeenCalledWith(cv);
    expect(embRepo.saveBatch).not.toHaveBeenCalled();
  });

  it('throws STORAGE_ERROR when atomic save fails', async () => {
    cvRepo.save.mockRejectedValue(new Error('DB down'));
    const cv = CvEntity.create({
      name: 'X',
      role: 'Y',
      skills: [],
      education: [],
      experience: [],
    });

    try {
      await service.ingest(cv, 'text');
    } catch (err) {
      expect(err).toBeInstanceOf(DomainError);
      expect((err as DomainError).code).toBe('STORAGE_ERROR');
    }
  });

  it('throws EMBEDDING_FAILED when embeddings fail', async () => {
    gemini.generateEmbeddings.mockRejectedValue(new Error('API down'));
    const cv = CvEntity.create({
      name: 'X',
      role: 'Y',
      skills: [],
      education: [],
      experience: [],
    });

    try {
      await service.ingest(cv, 'text');
    } catch (err) {
      expect((err as DomainError).code).toBe('EMBEDDING_FAILED');
    }
  });

  it('does not write anything when embedding generation fails', async () => {
    gemini.generateEmbeddings.mockRejectedValue(new Error('429 Too Many Requests'));
    const cv = CvEntity.create({
      name: 'X',
      role: 'Y',
      skills: [],
      education: [],
      experience: [],
    });

    await expect(service.ingest(cv, 'text')).rejects.toMatchObject({ code: 'EMBEDDING_FAILED' });
    expect(cvRepo.save).not.toHaveBeenCalled();
    expect(embRepo.saveBatch).not.toHaveBeenCalled();
  });
});