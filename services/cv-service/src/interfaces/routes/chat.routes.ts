import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { ChatService } from '../../application/chat/chat.service';

/**
 * Express router for chat endpoints.
 * Wires the chat controller to the POST /api/chat route.
 */
export function createChatRoutes(chatService: ChatService): Router {
  const router: Router = Router();
  const controller = new ChatController(chatService);

  router.post('/chat', controller.chat.bind(controller));

  return router;
}