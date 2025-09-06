'use client';

import { useChat } from 'ai/react';
import { useEffect } from 'react';

export default function FMGlobalChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/fm-global',
  });

  // Log everything for debugging
  useEffect(() => {
    console.log('Chat component mounted');
    console.log('API endpoint:', '/api/fm-global');
    if (error) {
      console.error('Chat error:', error);
    }
  }, [error]);

  useEffect(() => {
    console.log('Messages updated:', messages);
  }, [messages]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔥 FM Global ASRS Expert Chat
        </h1>
        <p className="text-gray-600">
          Ask me about sprinkler design for ASRS warehouses. I provide real FM Global 8-34 compliant specifications.
        </p>
      </div>

      {/* Example Queries */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="font-semibold mb-2">Try these example queries:</p>
        <div className="space-y-2 text-sm">
          <button
            onClick={() => {
              const query = "I have a shuttle ASRS with open-top containers storing Class 3 commodities at 38 feet tall. What sprinkler protection do I need?";
              handleInputChange({ target: { value: query } } as any);
            }}
            className="block w-full text-left p-2 bg-white rounded hover:bg-blue-100"
          >
            "Shuttle ASRS with open-top containers, Class 3, 38 ft storage..."
          </button>
          <button
            onClick={() => {
              const query = "What are the in-rack sprinkler requirements for open-top containers in a mini-load ASRS?";
              handleInputChange({ target: { value: query } } as any);
            }}
            className="block w-full text-left p-2 bg-white rounded hover:bg-blue-100"
          >
            "In-rack requirements for open-top containers..."
          </button>
          <button
            onClick={() => {
              const query = "How can I reduce costs for ASRS sprinkler systems while maintaining FM Global compliance?";
              handleInputChange({ target: { value: query } } as any);
            }}
            className="block w-full text-left p-2 bg-white rounded hover:bg-blue-100"
          >
            "Cost optimization for FM Global compliance..."
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="mb-6 space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto border rounded-lg p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>No messages yet. Ask me about ASRS sprinkler design!</p>
            <p className="text-sm mt-2">I provide specific K-factors, pressures, flow rates, and FM Global requirements.</p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`p-4 rounded-lg ${
                m.role === 'user'
                  ? 'bg-blue-100 ml-auto max-w-[80%]'
                  : 'bg-white border border-gray-200 mr-auto max-w-[80%]'
              }`}
            >
              <div className="font-semibold mb-1">
                {m.role === 'user' ? '👤 You' : '🔥 FM Global Expert'}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
              {m.role === 'assistant' && m.content.includes('K') && (
                <div className="mt-2 text-xs text-green-600">
                  ✅ Includes specific technical requirements
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="p-4 bg-gray-100 rounded-lg animate-pulse">
            <div className="font-semibold mb-1">🔥 FM Global Expert</div>
            <div>Analyzing FM Global 8-34 requirements...</div>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-100 rounded-lg">
            <div className="font-semibold text-red-700">Error</div>
            <div className="text-red-600">{error.message || 'An error occurred'}</div>
            <div className="text-xs mt-2">Check browser console for details</div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="Describe your ASRS system (type, containers, commodity class, height, aisles)..."
          className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input?.trim()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Analyzing...' : 'Send'}
        </button>
      </form>

      {/* Debug Info */}
      <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
        <details>
          <summary className="cursor-pointer font-semibold">Debug Info (click to expand)</summary>
          <div className="mt-2 space-y-1">
            <div>API Endpoint: /api/fm-global</div>
            <div>Messages Count: {messages.length}</div>
            <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
            <div>Error: {error ? error.message : 'None'}</div>
            <div className="mt-2">
              <button
                onClick={() => {
                  console.log('Current messages:', messages);
                  console.log('Current input:', input);
                  console.log('Is loading:', isLoading);
                  console.log('Error:', error);
                }}
                className="px-3 py-1 bg-gray-600 text-white rounded text-xs"
              >
                Log State to Console
              </button>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}