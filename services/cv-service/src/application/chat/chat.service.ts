import { v4 as uuidv4 } from 'uuid';
import { GeminiClient } from '../../infrastructure/gemini/gemini.client';
import { ChatResponse, ChatSource } from '../../domain/chat/chat.types';
import { DomainError } from '../../domain/shared/app-error';
import { ICvQueryService } from '../cv/cv-query.service';

/**
 * Application service that orchestrates the RAG pipeline.
 * Embeds the incoming question, retrieves relevant CV chunks, then
 * generates a grounded response with source citations.
 */
export class ChatService {
  /**
   * @param geminiClient Gemini client used for embeddings and response generation.
   * @param cvQueryService Query-side service used to fetch similar CV chunks.
   * @param topK Number of most similar chunks to retrieve per question.
   */
  constructor(
    private readonly geminiClient: GeminiClient,
    private readonly cvQueryService: ICvQueryService,
    private readonly topK: number = 5
  ) {}

  /**
   * Answers a user question using retrieved context from the CV knowledge base.
   * @param question The user's question.
   * @param requestId Optional request identifier for error reporting.
   * @param conversationId Optional conversation to continue; a new one is
   *   created when omitted.
   * @returns The generated answer along with cited sources.
   * @throws DomainError when embedding or generation fails.
   */
  async answer(
    question: string,
    requestId?: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    let questionEmbedding: number[];
    try {
      questionEmbedding = await this.geminiClient.generateEmbedding(question);
    } catch (error) {
      throw new DomainError(
        'EMBEDDING_FAILED',
        'Failed to embed the question',
        { requestId, cause: error }
      );
    }

    let similarChunks;
    try {
      similarChunks = await this.cvQueryService.searchSimilar(
        questionEmbedding,
        this.topK
      );
    } catch (error) {
      throw new DomainError(
        'STORAGE_ERROR',
        'Failed to retrieve similar CV chunks',
        { requestId, cause: error }
      );
    }

    const prompt = this.buildPrompt(question, similarChunks);
    const sources: ChatSource[] = similarChunks.map((chunk, index) => ({
      cvId: chunk.cv.id,
      name: chunk.cv.name,
      role: chunk.cv.role,
      relevance: chunk.similarity,
      index,
    }));

    let answer: string;
    try {
      answer = await this.geminiClient.generateContent(prompt);
    } catch (error) {
      throw new DomainError(
        'LLM_UNAVAILABLE',
        'Failed to generate a response from the language model',
        { requestId, cause: error }
      );
    }

    return {
      answer,
      sources,
      requestId: requestId ?? '',
      conversationId: conversationId ?? uuidv4(),
    };
  }

  private buildPrompt(
    question: string,
    chunks: { embedding: { chunkText: string }; cv: { name: string; role: string } }[]
  ): string {
    const context = chunks
      .map(
        (chunk, index) =>
          `[${index}] ${chunk.cv.name} (${chunk.cv.role}):\n${chunk.embedding.chunkText}`
      )
      .join('\n\n');

    return (
      'You are a recruiting assistant. Answer the question using only the context below. ' +
      'Cite the source candidate names and roles. If the context is insufficient, say so.\n\n' +
      `CONTEXT:\n${context}\n\nQUESTION:\n${question}`
    );
  }
}
