'use client';

import { useState, useCallback } from 'react';
import { useChat } from '@/hooks/use-chat';
import { MessageList } from '@/components/chat/message-list';
import { MessageInput } from '@/components/chat/message-input';
import { CvViewerPanel } from '@/components/cv-viewer/cv-viewer-panel';
import { Nav } from '@/components/nav/nav';

export default function ChatPage() {
  const { messages, isLoading, error, sendMessage, clearError, clearChat } = useChat();
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);

  const handleOpenCv = useCallback((cvId: string) => {
    setSelectedCvId(cvId);
  }, []);

  const handleCloseCv = useCallback(() => {
    setSelectedCvId(null);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Nav />
      <header className="border-b bg-white p-4">
        <div className="max-w-3xl mx-auto px-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">CV Screening Chat</h1>
            <p className="text-sm text-gray-500">Ask questions about candidates</p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Clear conversation
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 h-full">
          <MessageList messages={messages} isLoading={isLoading} onOpenCv={handleOpenCv} />
        </div>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto px-6 w-full">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-2 rounded flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-700 hover:text-red-900 font-medium ml-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 w-full pb-6 pt-2">
        <MessageInput onSend={sendMessage} disabled={isLoading} />
      </div>

      <CvViewerPanel cvId={selectedCvId} onClose={handleCloseCv} />
    </div>
  );
}
