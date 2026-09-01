import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatService } from './chat.service';
import { DomainError } from '../../domain/shared/app-error';
import { CvEntity } from '../../domain/cv/cv.entity';
import { CvEmbedding } from '../../domain/cv/cv-embedding.entity';

function createMockQueryService(chunks: any[] = []) {
  return {
    findById: vi.fn(),
    findAll: vi.fn(),
    searchSimilar: vi.fn().mockResolvedValue(chunks),
  } as any;
}

function createMockGemini() {
  return {
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    generateContent: vi.fn().mockResolvedValue('John is experienced in React.'),
    generateEmbeddings: vi.fn().mockResolvedValue([[0.1, 0.2]]),
  } as any;
}

function createMockEmbeddingRepo(chunks: any[] = []) {
  return {
    findById: vi.fn(),
    findByCvId: vi.fn(),
    save: vi.fn(),
    saveBatch: vi.fn(),
    searchSimilar: vi.fn().mockResolvedValue(chunks),
  } as any;
}

function makeChunk(cvName: string, cvRole: string, text: string, similarity: number) {
  const cv = CvEntity.create({
    name: cvName,
    role: cvRole,
    skills: [],
    education: [],
    experience: [],
  });
  const embedding = CvEmbedding.create({
    cvId: cv.id,
    chunkText: text,
    chunkIndex: 0,
    embedding: [0.1, 0.2],
  });
  return { embedding, cv, similarity };
}

describe('ChatService', () => {
  let gemini: ReturnType<typeof createMockGemini>;
  let repo: ReturnType<typeof createMockEmbeddingRepo>;
  let queryService: ReturnType<typeof createMockQueryService>;

  beforeEach(() => {
    gemini = createMockGemini();
    repo = createMockEmbeddingRepo();
    queryService = createMockQueryService();
  });

  it('routes reads through the query service contract', async () => {
    const chunks = [makeChunk('Alice', 'Designer', 'Great design skills.', 0.95)];
    queryService.searchSimilar.mockResolvedValue(chunks);

    const service = new ChatService(gemini, queryService, 5);
    await service.answer('Who is a good designer?', 'req-1');

    expect(queryService.searchSimilar).toHaveBeenCalledWith([0.1, 0.2, 0.3], 5);
  });

  it('returns answer with sources on success', async () => {
    const chunks = [makeChunk('Alice', 'Designer', 'Great design skills.', 0.95)];
    repo.searchSimilar.mockResolvedValue(chunks);

    const service = new ChatService(gemini, queryService, 5);
    queryService.searchSimilar.mockResolvedValue(chunks);
    const response = await service.answer('Who is a good designer?', 'req-1');

    expect(response.answer).toBe('John is experienced in React.');
    expect(response.sources).toHaveLength(1);
    expect(response.sources[0].name).toBe('Alice');
    expect(response.sources[0].role).toBe('Designer');
    expect(response.sources[0].relevance).toBe(0.95);
    expect(response.requestId).toBe('req-1');
    expect(response.conversationId).toBeDefined();
  });

  it('generates a new conversationId when not provided', async () => {
    queryService.searchSimilar.mockResolvedValue([]);
    const service = new ChatService(gemini, queryService, 5);
    const response = await service.answer('test');

    expect(response.conversationId).toBeDefined();
    expect(response.conversationId.length).toBeGreaterThan(0);
  });

  it('passes provided conversationId through', async () => {
    queryService.searchSimilar.mockResolvedValue([]);
    const service = new ChatService(gemini, queryService, 5);
    const response = await service.answer('test', undefined, 'conv-123');

    expect(response.conversationId).toBe('conv-123');
  });

  it('throws EMBEDDING_FAILED when embedding fails', async () => {
    gemini.generateEmbedding.mockRejectedValue(new Error('API down'));

    const service = new ChatService(gemini, queryService, 5);

    await expect(service.answer('test', 'req-1')).rejects.toThrow(DomainError);
    try {
      await service.answer('test', 'req-1');
    } catch (err) {
      expect((err as DomainError).code).toBe('EMBEDDING_FAILED');
    }
  });

  it('throws STORAGE_ERROR when search fails', async () => {
    queryService.searchSimilar.mockRejectedValue(new Error('DB connection lost'));

    const service = new ChatService(gemini, queryService, 5);

    try {
      await service.answer('test', 'req-1');
    } catch (err) {
      expect((err as DomainError).code).toBe('STORAGE_ERROR');
    }
  });

  it('throws LLM_UNAVAILABLE when content generation fails', async () => {
    gemini.generateContent.mockRejectedValue(new Error('Model overloaded'));

    const service = new ChatService(gemini, queryService, 5);

    try {
      await service.answer('test', 'req-1');
    } catch (err) {
      expect((err as DomainError).code).toBe('LLM_UNAVAILABLE');
    }
  });

  it('builds a prompt that includes context chunks', async () => {
    const chunks = [
      makeChunk('Bob', 'Engineer', 'Python expert.', 0.9),
      makeChunk('Carol', 'PM', 'Scrum certified.', 0.8),
    ];
    queryService.searchSimilar.mockResolvedValue(chunks);

    const service = new ChatService(gemini, queryService, 5);
    await service.answer('Tell me about Bob', 'req-1');

    const prompt = gemini.generateContent.mock.calls[0][0];
    expect(prompt).toContain('Bob (Engineer)');
    expect(prompt).toContain('Python expert.');
    expect(prompt).toContain('Carol (PM)');
    expect(prompt).toContain('Scrum certified.');
    expect(prompt).toContain('Tell me about Bob');
  });

  it('uses topK parameter for search', async () => {
    queryService.searchSimilar.mockResolvedValue([]);
    const service = new ChatService(gemini, queryService, 10);
    await service.answer('test');

    expect(queryService.searchSimilar).toHaveBeenCalledWith([0.1, 0.2, 0.3], 10);
  });
});
