"use client";

import type { Message } from "ai";
import { useChat } from "ai/react";
import cx from "classnames";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Weather } from "../../weather";

export default function Page() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: chatLoading,
    error,
  } = useChat({
    api: "/api/fm-global-chat", // Use RAG-powered FM Global API
  });
  // Handle loading state when submitting
  const handleFormSubmit = (e: React.FormEvent) => {
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className=" border-b border-gray-100 p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Claude AI Assistant
          </h1>
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 px-3 py-1 rounded-lg border border-red-800/50">
              Error: {error.message || "Something went wrong"}
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col p-4">
          {/* Messages container */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                    </div>
                    <svg
                      className="w-20 h-20 mx-auto mb-6 relative text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <p className="text-xl font-medium text-gray-300 mb-2">
                    Start a conversation with Claude
                  </p>
                  <p className="text-sm text-gray-500">
                    Ask a question about FM Global documentation or try "What's
                    the weather like?"
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message: Message, index: number) => (
                <div
                  key={message.id}
                  className={cx(
                    "group relative animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                    {
                      "ml-auto max-w-[85%]": message.role === "user",
                      "mr-auto max-w-[90%]": message.role !== "user",
                    }
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className={cx("rounded-2xl transition-all duration-200", {
                      "bg-gradient-to-br from-blue-600 to-blue-700 text-white":
                        message.role === "user",
                      "bg-gray-50 border border-gray-100":
                        message.role !== "user",
                    })}
                  >
                    {/* Message Header */}
                    <div
                      className={cx(
                        "flex items-center gap-3 px-4 py-3 border-b",
                        {
                          "border-blue-500/30": message.role === "user",
                          "border-gray-800": message.role !== "user",
                        }
                      )}
                    >
                      <div
                        className={cx(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                          {
                            "bg-white/20 backdrop-blur":
                              message.role === "user",
                            "bg-gradient-to-br from-purple-500 to-pink-500":
                              message.role !== "user",
                          }
                        )}
                      >
                        {message.role === "user" ? "U" : "AI"}
                      </div>
                      <div className="flex-1">
                        <p
                          className={cx("font-semibold text-sm", {
                            "text-blue-100": message.role === "user",
                            "text-gray-300": message.role !== "user",
                          })}
                        >
                          {message.role === "user" ? "You" : "Claude AI"}
                        </p>
                        <p
                          className={cx("text-xs opacity-70", {
                            "text-blue-200": message.role === "user",
                            "text-gray-500": message.role !== "user",
                          })}
                        >
                          Just now
                        </p>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="px-4 py-4">
                      {message.role === "user" ? (
                        <div className="leading-relaxed">{message.content}</div>
                      ) : (
                        <ReactMarkdown
                          components={{
                            // Headings
                            h1: ({ children }) => (
                              <h1 className="text-2xl font-bold text-gray-100 mb-4 mt-6 border-b border-gray-800 pb-2">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-xl font-semibold text-gray-100 mb-3 mt-5">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-lg font-semibold text-gray-200 mb-2 mt-4">
                                {children}
                              </h3>
                            ),
                            // Paragraphs
                            p: ({ children }) => (
                              <p className="text-gray-300 leading-relaxed mb-4">
                                {children}
                              </p>
                            ),
                            // Lists
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside space-y-2 mb-4 text-gray-300 ml-4">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-300 ml-4">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-gray-300 leading-relaxed">
                                {children}
                              </li>
                            ),
                            // Links
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {children}
                              </a>
                            ),
                            // Emphasis
                            strong: ({ children }) => (
                              <strong className="font-bold text-gray-100">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-gray-300">
                                {children}
                              </em>
                            ),
                            // Blockquotes
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-purple-500 pl-4 my-4 bg-gray-800/50 py-2 pr-4 rounded-r-lg">
                                {children}
                              </blockquote>
                            ),
                            // Code
                            code: ({ className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(
                                className || ""
                              );
                              const language = match ? match[1] : "";
                              const inline = !match;

                              if (!inline && match) {
                                return (
                                  <div className="relative group my-4">
                                    <div className="absolute top-0 right-0 px-2 py-1 text-xs text-gray-400 bg-gray-900 rounded-bl-lg">
                                      {language}
                                    </div>
                                    <SyntaxHighlighter
                                      style={oneDark as any}
                                      language={language}
                                      PreTag="div"
                                      className="rounded-lg"
                                      customStyle={{
                                        margin: 0,
                                        padding: "1.5rem",
                                        fontSize: "0.875rem",
                                        lineHeight: "1.5",
                                      }}
                                    >
                                      {String(children).replace(/\n$/, "")}
                                    </SyntaxHighlighter>
                                  </div>
                                );
                              }

                              return (
                                <code
                                  className="bg-gray-800 text-pink-400 px-1.5 py-0.5 rounded text-sm font-mono"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                            // Tables
                            table: ({ children }) => (
                              <div className="overflow-x-auto my-4">
                                <table className="min-w-full divide-y divide-gray-200">
                                  {children}
                                </table>
                              </div>
                            ),
                            thead: ({ children }) => (
                              <thead className="bg-gray-50">{children}</thead>
                            ),
                            tbody: ({ children }) => (
                              <tbody className="bg-gray-50 divide-y divide-gray-200">
                                {children}
                              </tbody>
                            ),
                            th: ({ children }) => (
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="px-4 py-3 text-sm text-gray-400">
                                {children}
                              </td>
                            ),
                            // Horizontal Rule
                            hr: () => <hr className="border-gray-200 my-6" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      )}

                      {/* Handle tool invocations if they exist */}
                      {message.toolInvocations &&
                        message.toolInvocations.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-800">
                            {message.toolInvocations.map(
                              (toolInvocation: any) => {
                                const { toolName, toolCallId, state } =
                                  toolInvocation;

                                if (state === "call") {
                                  return (
                                    <div
                                      key={toolCallId}
                                      className={cx({
                                        "animate-pulse": [
                                          "getWeather",
                                        ].includes(toolName),
                                      })}
                                    >
                                      {toolName === "getWeather" ? (
                                        <div className="mt-2 p-3 bg-blue-900/20 rounded-lg border border-blue-800/50">
                                          <div className="text-sm text-blue-400 mb-2 flex items-center gap-2">
                                            <svg
                                              className="animate-spin h-4 w-4"
                                              fill="none"
                                              viewBox="0 0 24 24"
                                            >
                                              <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                              ></circle>
                                              <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                              ></path>
                                            </svg>
                                            Fetching weather data...
                                          </div>
                                          <Weather />
                                        </div>
                                      ) : null}
                                    </div>
                                  );
                                }

                                if (state === "result") {
                                  const { result } = toolInvocation;

                                  return (
                                    <div
                                      key={toolCallId}
                                      className="mt-2 p-3 bg-green-900/20 rounded-lg border border-green-800/50"
                                    >
                                      <div className="text-sm text-green-400 mb-2 flex items-center gap-2">
                                        <svg
                                          className="h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Tool result: {toolName}
                                      </div>
                                      {toolName === "getWeather" ? (
                                        <Weather weatherAtLocation={result} />
                                      ) : (
                                        <pre className="text-xs overflow-x-auto p-3 bg-gray-50 rounded-lg font-mono text-gray-400">
                                          {JSON.stringify(result, null, 2)}
                                        </pre>
                                      )}
                                    </div>
                                  );
                                }

                                return null;
                              }
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Loading indicator for AI response */}
            {chatLoading &&
              messages.length > 0 &&
              messages[messages.length - 1].role === "user" && (
                <div className="mr-auto max-w-[90%]">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                        AI
                      </div>
                      <div className="flex gap-2">
                        <div
                          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Input form */}
          <form onSubmit={handleFormSubmit} className="relative flex-shrink-0">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200">
              <div className="flex gap-3">
                <input
                  name="prompt"
                  value={input}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500 transition-all"
                  placeholder="Ask Claude anything..."
                  disabled={chatLoading}
                  autoComplete="off"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !input?.trim()}
                  className={cx(
                    "px-6 py-3 rounded-xl font-medium transition-all transform",
                    {
                      "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-105 active:scale-95":
                        !chatLoading && input?.trim(),
                      "bg-gray-50 text-gray-200 cursor-not-allowed":
                        chatLoading || !input?.trim(),
                    }
                  )}
                >
                  {chatLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Thinking...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
              <div className="mt-2 px-4">
                <p className="text-xs text-gray-500">
                  Claude can help with FM Global documentation, analysis, and
                  general questions
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* Add custom scrollbar and animation styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(
            to bottom,
            rgba(139, 92, 246, 0.5),
            rgba(236, 72, 153, 0.5)
          );
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(
            to bottom,
            rgba(139, 92, 246, 0.7),
            rgba(236, 72, 153, 0.7)
          );
        }

        @keyframes animate-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-in {
          animation: animate-in 0.3s ease-out forwards;
        }

        body {
          background-color: rgb(3, 7, 18);
        }

        /* Prose overrides for better dark mode */
        .prose pre {
          background-color: transparent !important;
        }

        .prose code::before,
        .prose code::after {
          content: none !important;
        }
      `}</style>
    </div>
  );
}
