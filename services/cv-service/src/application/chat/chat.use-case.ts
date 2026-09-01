import { ChatService } from './chat.service';
import { ChatRequest, ChatResponse } from '../../domain/chat/chat.types';

export interface ChatCommand {
  message: string;
  requestId?: string;
  conversationId?: string;
}

/**
 * Use case that executes a chat command against the ChatService.
 * Acts as a thin application boundary that holds request context
 * and propagates errors from the underlying service.
 */
export class ChatUseCase {
  /**
   * @param chatService Service that orchestrates the RAG pipeline.
   */
  constructor(private readonly chatService: ChatService) {}

  /**
   * Executes a single chat turn.
   * @param command The incoming chat message and request context.
   * @returns The chat response with answer and sources.
   */
  async execute(command: ChatCommand): Promise<ChatResponse> {
    return this.chatService.answer(
      command.message,
      command.requestId,
      command.conversationId
    );
  }
}
