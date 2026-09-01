import { Request, Response, NextFunction } from 'express';
import { ChatRequest, ChatResponse } from '../../domain/chat/chat.types';
import { DomainError } from '../../domain/shared/app-error';
import { ChatService } from '../../application/chat/chat.service';

/**
 * HTTP controller for chat endpoints.
 * Validates request bodies, delegates to the ChatService, and formats responses.
 */
export class ChatController {
  private readonly chatService: ChatService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }

  /**
   * Handles POST /api/chat.
   * Validates the request body and returns a chat response with sources.
   */
  async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as Partial<ChatRequest>;

      if (typeof body.message !== 'string' || body.message.trim() === '') {
        throw new DomainError('VALIDATION_ERROR', 'message is required and must be a non-empty string');
      }

      const response: ChatResponse = await this.chatService.answer(
        body.message,
        req.requestId
      );

      res.json({
        answer: response.answer,
        sources: response.sources,
        requestId: req.requestId ?? response.requestId,
        conversationId: response.conversationId,
      });
    } catch (err) {
      next(err);
    }
  }
}