"use client";

import { useChat } from "ai/react";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Chat({
  id,
  initialMessages = [],
}: { id?: string | undefined; initialMessages?: any[] } = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } =
    useChat({
      id,
      api: "/api/chat",
      initialMessages,
    });

  useEffect(() => {
    if (!isLoading) {
      inputRef?.current?.focus();
    }
  }, [isLoading]);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          Back to Home
        </Link>
      </div>
      
      <div className="space-y-4 mb-8">
        {messages.map((message) => (
          <div key={message.id} className="whitespace-pre-wrap">
            <div className="font-semibold text-sm mb-2">
              {message.role === "user" ? "User:" : "AI:"}
            </div>
            <div className="pl-4 border-l-2 border-gray-200">
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-red-600 text-sm mb-4">
          Error: {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <input
          className="w-full p-2 border border-gray-300 rounded shadow-sm mb-2"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
          ref={inputRef}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Thinking..." : "Send"}
        </button>
      </form>
    </div>
  );
}

