import { Message, MessageRole } from './message.entity';
import { Conversation } from './conversation.entity';

export { Message, MessageRole } from './message.entity';
export { Conversation } from './conversation.entity';

export interface ChatRequest {
  message: string;
  conversationId?: string;
}

export interface ChatSource {
  cvId: string;
  name: string;
  role: string;
  relevance: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
  requestId: string;
  conversationId: string;
}
