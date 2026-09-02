'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
  clearChat: () => void;
}

const STORAGE_KEY = 'leadtech-chat-history';
const TTL_MS = 60 * 60 * 1000;

interface StoredChat {
  savedAt: number;
  conversationId?: string;
  messages: ChatMessage[];
}

function loadStoredChat(): StoredChat | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const stored = JSON.parse(raw) as StoredChat;
    if (!stored || !stored.savedAt || !Array.isArray(stored.messages)) return null;

    if (Date.now() - stored.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return {
      ...stored,
      messages: stored.messages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      })),
    };
  } catch {
    return null;
  }
}

function saveChat(messages: ChatMessage[], conversationId?: string) {
  try {
    const payload: StoredChat = {
      savedAt: Date.now(),
      conversationId,
      messages,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage may be unavailable; ignore to avoid breaking chat
  }
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = loadStoredChat();
    if (stored) {
      setMessages(stored.messages);
      setConversationId(stored.conversationId);
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    if (messages.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    saveChat(messages, conversationId);
  }, [messages, conversationId]);

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

  const clearChat = useCallback(() => {
    setMessages([]);
    setConversationId(undefined);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearError, clearChat };
}
