'use client';

import { useState, useCallback } from 'react';
import {
  sendChatMessage,
  ChatApiResponse,
  ChatApiError,
  ChatSource,
} from '@/lib/api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ChatSource[];
  timestamp: Date;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearError: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const data: ChatApiResponse = await sendChatMessage(content, conversationId);

        const assistantMessage: ChatMessage = {
          id: data.requestId,
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setConversationId(data.conversationId);
      } catch (err) {
        const apiError = err as ChatApiError;
        setError(apiError.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearError };
}
