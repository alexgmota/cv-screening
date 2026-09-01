import ReactMarkdown from 'react-markdown';
import { ChatMessage } from '@/hooks/use-chat';
import { SourceCard } from './source-card';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onOpenCv?: (cvId: string) => void;
}

export function MessageList({ messages, isLoading, onOpenCv }: MessageListProps) {
  return (
    <div className="h-full overflow-y-auto py-4 space-y-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <p className="text-lg">Ask a question about candidates</p>
            <p className="text-sm mt-1">e.g., &quot;Who has experience with Python?&quot;</p>
          </div>
        </div>
      )}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-2xl rounded-lg px-4 py-3 ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white border text-gray-900'
            }`}
          >
            {message.role === 'user' ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            )}
            {message.sources && message.sources.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-2">Sources:</p>
                <div className="space-y-2">
                  {message.sources.map((source) => (
                    <SourceCard key={source.cvId} source={source} onOpenCv={onOpenCv} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white border rounded-lg px-4 py-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
