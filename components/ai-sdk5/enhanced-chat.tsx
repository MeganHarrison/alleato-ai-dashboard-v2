// @ts-nocheck
// @ts-nocheck
"use client";

import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { useState, useEffect, useRef } from "react";
import { 
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { 
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { MyUIMessage } from "@/lib/ai-sdk5/types/message-types";
import { ProjectManagerWelcome } from "./project-manager-welcome";
import { MinimalWelcome } from "./minimal-welcome";
import { saveChat } from "@/lib/ai-sdk5/db/actions";

interface EnhancedChatProps {
  id: string;
  chatId?: string;
  initialMessages?: UIMessage[];
  initialPrompt?: string;
  endpoint?: string;
  welcomeMessage?: string;
  suggestedQuestions?: string[];
  minimalWelcome?: boolean;
}

export function EnhancedChat({ 
  id, 
  chatId,
  initialMessages = [], 
  initialPrompt,
  endpoint = "/persistent-chat/api",
  welcomeMessage,
  suggestedQuestions = [],
  minimalWelcome = false
}: EnhancedChatProps) {
  const [input, setInput] = useState(initialPrompt || "");
  const [hasSubmittedInitial, setHasSubmittedInitial] = useState(false);
  const lastSavedMessagesRef = useRef<string>("");

  /**
   * Configure useChat hook with proper AI SDK 5 settings
   * Documentation: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
   * 
   * Key features:
   * - Automatic message streaming with tool results
   * - Persistence callbacks for chat history
   * - Error handling and retry logic
   */
  const { messages, sendMessage, status, error, reload, stop, input: chatInput, setInput: setChatInput } = useChat({
    id,
    api: endpoint,
    initialMessages,
    body: {
      chatId: chatId || id,
    },
    // Experimental features for better tool handling
    // Docs: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#experimental
    experimental_toolCallStreaming: true,
    // Enable automatic persistence
    onFinish: async ({ message, messages: allMessages }) => {
      // Save messages after each AI response
      try {
        // Check if allMessages is valid
        if (!allMessages || !Array.isArray(allMessages)) {
          console.warn('onFinish: allMessages is not valid, using current messages instead');
          allMessages = messages; // Use the messages from useChat hook
        }
        
        // Convert messages to string for comparison
        const messagesString = JSON.stringify(allMessages);
        
        // Only save if messages have changed and are not empty
        if (messagesString !== lastSavedMessagesRef.current && allMessages.length > 0) {
          await saveChat({ chatId: id, messages: allMessages });
          lastSavedMessagesRef.current = messagesString;
          console.log(`Chat ${id} saved with ${allMessages.length} messages`);
        }
      } catch (error) {
        console.error("Failed to save chat:", error);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Treat both submitted and streaming as loading
  const isLoading = status === 'submitted' || status === 'streaming';

  // Auto-submit initial prompt if provided
  useEffect(() => {
    if (initialPrompt && !hasSubmittedInitial && messages.length === 0 && !isLoading) {
      setHasSubmittedInitial(true);
      // Send initial prompt directly using proper format
      // Docs: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#sendmessage
      sendMessage({ text: initialPrompt });
      setInput("");
    }
  }, [initialPrompt, hasSubmittedInitial, messages.length, isLoading, sendMessage]);

  // Save messages periodically while streaming
  useEffect(() => {
    if (!isLoading) return;

    const saveInterval = setInterval(async () => {
      try {
        const messagesString = JSON.stringify(messages);
        if (messagesString !== lastSavedMessagesRef.current && messages.length > 0) {
          await saveChat({ chatId: id, messages });
          lastSavedMessagesRef.current = messagesString;
          console.log(`Chat ${id} auto-saved during streaming`);
        }
      } catch (error) {
        console.error("Failed to auto-save chat:", error);
      }
    }, 5000); // Save every 5 seconds while streaming

    return () => clearInterval(saveInterval);
  }, [isLoading, messages, id]);

  /**
   * Handle form submission
   * Uses the built-in sendMessage from useChat
   * Docs: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#sendmessage
   */
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      const messageToSend = input;
      setInput("");
      // Send message with proper format - sendMessage expects an object with text property
      await sendMessage({ text: messageToSend });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  /**
   * Helper function to render message content
   * Documentation: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat#message-types
   * Handles text, tool-call, and tool-result parts per AI SDK 5 spec
   */
  const renderMessageContent = (message: UIMessage) => {
    // Handle legacy content field for backward compatibility
    if (typeof message.content === 'string' && message.content) {
      return <Response>{message.content}</Response>;
    }

    // Handle parts-based messages (AI SDK 5 format)
    // Docs: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling#tool-results-in-the-ui
    if (message.parts && message.parts.length > 0) {
      return message.parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return (
              <Response key={`${message.id}-part-${i}`}>
                {part.text}
              </Response>
            );
          case 'tool-call':
            // Display tool invocations for transparency
            // Docs: https://ai-sdk.dev/docs/ai-sdk-ui/chatbot#displaying-tool-invocations
            return (
              <div key={`${message.id}-tool-${i}`} className="my-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="animate-pulse">🔍</span>
                  <span className="font-medium">Searching: {part.toolName}</span>
                </div>
                {part.args && (
                  <div className="mt-1 font-mono text-[10px] opacity-60">
                    Query: {JSON.stringify(part.args).slice(0, 100)}...
                  </div>
                )}
              </div>
            );
          case 'tool-result':
            // Show condensed tool results for context
            // Only show if result indicates success
            if (part.result?.success === false) {
              return (
                <div key={`${message.id}-result-${i}`} className="my-1 text-xs text-destructive">
                  ⚠️ Search failed: {part.result?.error || 'Unknown error'}
                </div>
              );
            }
            // Show success indicator
            if (part.result?.totalResults > 0 || part.result?.meetingChunks?.length > 0) {
              return (
                <div key={`${message.id}-result-${i}`} className="my-1 text-xs text-muted-foreground">
                  ✓ Found {part.result?.totalResults || part.result?.meetingChunks?.length || 0} relevant results
                </div>
              );
            }
            return null;
          default:
            return null;
        }
      });
    }

    // No content to display
    return null;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Conversation Area */}
      <div className="flex-1 overflow-hidden">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.length === 0 ? (
              minimalWelcome ? (
                <MinimalWelcome
                  onSuggestionClick={handleSuggestionClick}
                  welcomeMessage={welcomeMessage}
                  suggestedQuestions={suggestedQuestions}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-2xl">
                    <ProjectManagerWelcome 
                      onSuggestionClick={handleSuggestionClick}
                      welcomeMessage={welcomeMessage}
                      suggestedQuestions={suggestedQuestions}
                    />
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <Message key={message.id} from={message.role}>
                    <MessageContent>
                      {renderMessageContent(message)}
                    </MessageContent>
                  </Message>
                ))}
                
                {/* Show loading indicator when streaming */}
                {isLoading && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="animate-pulse">●</div>
                    <span className="text-sm">AI is thinking...</span>
                    <button
                      onClick={stop}
                      className="ml-auto text-xs hover:text-foreground"
                    >
                      Stop
                    </button>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mx-auto max-w-2xl">
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                  <p className="text-sm">Error: {error.message}</p>
                  <button 
                    onClick={() => reload()}
                    className="mt-2 text-xs underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="mx-auto max-w-2xl">
          <PromptInput onSubmit={onSubmit} data-chat-form>
            <PromptInputTextarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
              }}
              placeholder="Message Project Manager AI..."
              disabled={isLoading}
              onKeyDown={(e) => {
                // Submit on Enter (without shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  const form = e.currentTarget.closest('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }
              }}
            />
            <PromptInputToolbar>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {messages.length > 0 && (
                  <span>Chat ID: {id.slice(-8)}</span>
                )}
              </div>
              <PromptInputSubmit 
                disabled={!input.trim() || isLoading}
                status={isLoading ? "streaming" : "ready"}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}
