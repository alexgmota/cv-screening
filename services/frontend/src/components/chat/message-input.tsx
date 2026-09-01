'use client';

import { useState } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-lg shadow-gray-200/60 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about candidates..."
        disabled={disabled}
        className="flex-1 bg-transparent border-0 rounded-xl px-2 py-2 focus:outline-none focus:ring-0 disabled:bg-transparent disabled:text-gray-400"
      />
      <button
        type="submit"
        disabled={disabled || !input.trim()}
        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        Send
      </button>
    </form>
  );
}
