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

export function EnhancedChatFixed({ 
  id, 
  chatId,
  initialMessages = [], 
  initialPrompt,
  endpoint = "/persistent-chat/api",
  welcomeMessage,
  suggestedQuestions = [],
  minimalWelcome = false
}: EnhancedChatProps) {
  const [input] = useState($2);
  // Use useChat hook with simpler configuration first
  const chatResult = useChat({
    id,
    api: endpoint,
    initialMessages,
    body: {
      chatId: chatId || id,
    },
  });

  // Log what we're getting from useChat
  console.log('useChat result keys:', Object.keys(chatResult));
  
  // Destructure based on what's actually returned
  const { 
    messages, 
    isLoading, 
    error,
    // Try different method names based on the API
    handleSubmit,
    submit,
    sendMessage,
    handleInputChange,
    setInput: setChatInput,
    input: chatInput,
    reload,
    stop
  } = chatResult as any;

  // Determine which submit function to use
  const submitFunction = handleSubmit || submit || sendMessage;
  const inputChangeFunction = handleInputChange || ((e: unknown) => setInput(e.target.value));

  useEffect(() => {
    console.log('Available functions:', {
      handleSubmit: !!handleSubmit,
      submit: !!submit,
      sendMessage: !!sendMessage,
      handleInputChange: !!handleInputChange,
    });
  }, [handleSubmit, submit, sendMessage, handleInputChange]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!submitFunction) {
      console.error('No submit function available from useChat');
      return;
    }
    
    if (input.trim()) {
      try {
        // Try different ways of calling submit
        if (handleSubmit) {
          // Standard useChat API
          handleSubmit(e);
        } else if (sendMessage) {
          // Alternative API - sendMessage expects an object with text property
          // and optional body parameter
          sendMessage(
            { text: input },
            {
              body: {
                chatId: chatId || id,
              }
            }
          );
          setInput("");
        } else if (submit) {
          // Another alternative
          submit({ message: input });
          setInput("");
        }
      } catch (err) {
        console.error('Submit error:', err);
      }
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

  // Render message content
  const renderMessageContent = (message: MyUIMessage) => {
    if (!message.content) return null;
    
    return message.content;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Conversation Area */}
      <div className="flex-1 overflow-hidden">
        <Conversation className="h-full">
          <ConversationContent>
            {(messages?.length || 0) === 0 ? (
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
                {messages.map((message: unknown) => (
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
                    {stop && (
                      <button
                        onClick={stop}
                        className="ml-auto text-xs hover:text-foreground"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="mx-auto max-w-2xl">
                <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                  <p className="text-sm">Error: {error.message || error}</p>
                  {reload && (
                    <button 
                      onClick={() => reload()}
                      className="mt-2 text-xs underline hover:no-underline"
                    >
                      Retry
                    </button>
                  )}
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
                // Also call the chat input change if available
                if (inputChangeFunction && handleInputChange) {
                  inputChangeFunction(e);
                }
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
                {(messages?.length || 0) > 0 && (
                  <span>Chat ID: {id.slice(-8)}</span>
                )}
              </div>
              <PromptInputSubmit 
                disabled={!input?.trim() || isLoading || !submitFunction}
                status={isLoading ? "streaming" : "ready"}
              />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </div>
  );
}