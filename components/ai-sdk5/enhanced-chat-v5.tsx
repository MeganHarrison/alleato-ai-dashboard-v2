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
import { 
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
import { MinimalWelcome } from "./minimal-welcome";
import { saveChat } from "@/lib/ai-sdk5/db/actions";

interface EnhancedChatProps {
  id: string;
  chatId?: string;
  initialMessages?: UIMessage[];
  endpoint?: string;
  welcomeMessage?: string;
  suggestedQuestions?: string[];
  minimalWelcome?: boolean;
}

export function EnhancedChatV5({ 
  id, 
  chatId,
  initialMessages = [], 
  endpoint = "/api/pm-chat",
  welcomeMessage,
  suggestedQuestions = [],
  minimalWelcome = false
}: EnhancedChatProps) {
  const [input, setInput] = useState("");
  
  // Use the useChat hook properly according to AI SDK v5
  const { messages, handleSubmit, handleInputChange, isLoading, error, reload, stop } = useChat({
    id,
    api: endpoint,
    initialMessages,
    body: {
      chatId: chatId || id,
    },
    onFinish: async (message, { messages: allMessages }) => {
      // Save messages after each AI response
      try {
        await saveChat({ chatId: id, messages: allMessages });
        console.log(`Chat ${id} saved successfully`);
      } catch (error) {
        console.error("Failed to save chat:", error);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Handle form submission
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      // Use handleSubmit from useChat
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Update the input through handleInputChange
    const syntheticEvent = {
      target: { value: suggestion }
    } as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(syntheticEvent);
    
    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.querySelector('form[data-chat-form]') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  // Render message content - handle both string content and parts
  const renderMessageContent = (message: UIMessage) => {
    // Handle string content (backward compatibility)
    if (typeof message.content === 'string' && message.content) {
      return <div>{message.content}</div>;
    }

    // Handle parts-based messages (AI SDK v5)
    if (message.parts && message.parts.length > 0) {
      return message.parts.map((part: any, i: number) => {
        switch (part.type) {
          case 'text':
            return <div key={`${message.id}-part-${i}`}>{part.text}</div>;
          case 'tool-call':
            return (
              <div key={`${message.id}-tool-${i}`} className="text-xs text-muted-foreground">
                <span className="font-mono">🔧 {part.toolName}</span>
              </div>
            );
          default:
            return null;
        }
      });
    }

    return null;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Conversation Area */}
      <div className="flex-1 overflow-hidden">
        <Conversation className="h-full">
          <ConversationContent>
            {messages.length === 0 ? (
              <MinimalWelcome
                onSuggestionClick={handleSuggestionClick}
                welcomeMessage={welcomeMessage}
                suggestedQuestions={suggestedQuestions}
              />
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
      <div className="border-t bg-background p-4 pm-assistant-input">
        <div className="mx-auto max-w-2xl">
          <PromptInput onSubmit={onSubmit}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                handleInputChange(e);
              }}
              placeholder="Message PM Assistant..."
              disabled={isLoading}
              onKeyDown={(e) => {
                // Submit on Enter (without shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e as any);
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