import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, createMockChatService, MockChatService } from '../helpers/setup';
import { DomainError } from '../../src/domain/shared/app-error';

vi.mock('../../src/infrastructure/gemini/gemini.client', () => {
  const gemini = {
    generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    generateContent: vi.fn().mockResolvedValue('This is a real app response.'),
    generateEmbeddings: vi.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
  };

  return {
    GeminiClient: vi.fn().mockImplementation(function () {
      return gemini;
    }),
  };
});

vi.mock('../../src/infrastructure/database/embedding.repository.impl', () => ({
  EmbeddingRepositoryImpl: vi.fn().mockImplementation(function () {
    return {
      searchSimilar: vi.fn().mockResolvedValue([]),
    };
  }),
}));

import { createApp } from '../../src/index';

describe('Chat Endpoints', () => {
  let app: ReturnType<typeof createTestApp>;
  let mockChatService: MockChatService;

  beforeEach(() => {
    mockChatService = createMockChatService();
    app = createTestApp({ chatService: mockChatService });
  });

  describe('POST /api/chat', () => {
    it('should return 200 with answer and sources on valid request', async () => {
      mockChatService.answer.mockResolvedValue({
        answer: 'John Doe is a senior developer with 5 years of experience.',
        sources: [
          { cvId: 'cv-1', name: 'John Doe', role: 'Senior Developer', relevance: 0.92, index: 0 },
        ],
        requestId: 'req-123',
        conversationId: 'conv-456',
      });

      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Tell me about John Doe' })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('sources');
      expect(res.body).toHaveProperty('requestId');
      expect(res.body).toHaveProperty('conversationId');
      expect(res.body.answer).toBe('John Doe is a senior developer with 5 years of experience.');
      expect(res.body.sources).toHaveLength(1);
      expect(res.body.sources[0].name).toBe('John Doe');
      expect(mockChatService.answer).toHaveBeenCalledWith(
        'Tell me about John Doe',
        expect.any(String)
      );
    });

    it('should return 200 with empty sources when no matches found', async () => {
      mockChatService.answer.mockResolvedValue({
        answer: 'I could not find relevant information.',
        sources: [],
        requestId: 'req-123',
        conversationId: 'conv-789',
      });

      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Who is the CEO?' })
        .expect(200);

      expect(res.body.answer).toBe('I could not find relevant information.');
      expect(res.body.sources).toHaveLength(0);
    });

    it('should return 400 when message is missing', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({})
        .expect(400);

      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body).toHaveProperty('status', 'error');
    });

    it('should return 400 when message is empty string', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: '' })
        .expect(400);

      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 when message is whitespace only', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: '   ' })
        .expect(400);

      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 400 when message is not a string', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 123 })
        .expect(400);

      expect(res.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return 503 when LLM is unavailable', async () => {
      mockChatService.answer.mockRejectedValue(
        new DomainError('LLM_UNAVAILABLE', 'LLM service unavailable')
      );

      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'Hello' })
        .expect(503);

      expect(res.body).toHaveProperty('status', 'error');
    });

    it('should include X-Request-Id header in response', async () => {
      mockChatService.answer.mockResolvedValue({
        answer: 'test',
        sources: [],
        requestId: '',
        conversationId: 'conv-1',
      });

      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'test' })
        .expect(200);

      expect(res.headers['x-request-id']).toBeDefined();
    });

    it('should wire the production ChatService with Gemini and vector search dependencies', async () => {
      const productionApp = createApp();

      const res = await request(productionApp)
        .post('/api/chat')
        .send({ message: 'Who is the best candidate?' })
        .expect(200);

      expect(res.body.answer).toBe('This is a real app response.');
      expect(res.body.sources).toEqual([]);
    });
  });
});