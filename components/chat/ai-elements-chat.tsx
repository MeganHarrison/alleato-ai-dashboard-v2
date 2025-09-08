"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import type { Message as AIMessage } from "ai";
import { Conversation } from "@/components/ai-elements/conversation";
import { Message } from "@/components/ai-elements/message";
import { Response } from "@/components/ai-elements/response";
import { PromptInput } from "@/components/ai-elements/prompt-input";
import { Loader } from "@/components/ai-elements/loader";
import { Tool } from "@/components/ai-elements/tool";
import { Actions } from "@/components/ai-elements/actions";
import { CodeBlock } from "@/components/ai-elements/code-block";
import { Task } from "@/components/ai-elements/task";
import { Branch } from "@/components/ai-elements/branch";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { InlineCitation } from "@/components/ai-elements/inline-citation";
import { Button } from "@/components/ui/button";
import { 
  IconRefresh, 
  IconStop, 
  IconCopy, 
  IconCheck,
  IconUser,
  IconRobot,
  IconSend,
  IconLoader2,
} from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface AIElementsChatProps {
  api?: string;
  initialMessages?: AIMessage[];
  suggestedPrompts?: string[];
  placeholder?: string;
  className?: string;
  onReset?: () => void;
}

export function AIElementsChat({
  api = "/api/chat",
  initialMessages = [],
  suggestedPrompts = [
    "What can you help me with?",
    "Explain how FM Global documentation works",
    "Help me understand ASRS sprinkler requirements",
    "What are the key compliance standards?",
  ],
  placeholder = "Ask me anything...",
  className,
  onReset,
}: AIElementsChatProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    stop,
    reload,
    append,
  } = useChat({
    api,
    initialMessages,
    onError: (err: Error) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    handleSubmit(new Event('submit') as any);
  };

  const handleRetry = () => {
    if (messages.length > 0) {
      reload();
    }
  };

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <IconRobot className="w-5 h-5 text-white" />
          </div>
          <h2 className="font-semibold">AI Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={stop}
              className="gap-2"
            >
              <IconStop className="w-4 h-4" />
              Stop
            </Button>
          )}
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-2"
            >
              <IconRefresh className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
        <Conversation className="py-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 flex items-center justify-center mb-4">
                <IconRobot className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">How can I help you today?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                I'm here to assist with your questions about FM Global documentation, 
                ASRS requirements, and compliance standards.
              </p>
              
              {/* Suggested prompts */}
              <div className="grid gap-2 max-w-md w-full">
                {suggestedPrompts.map((prompt, index) => (
                  <Suggestion
                    key={index}
                    onClick={() => handleSuggestionClick(prompt)}
                    className="cursor-pointer"
                  >
                    {prompt}
                  </Suggestion>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message: AIMessage, index: number) => (
              <Message
                key={message.id}
                role={message.role}
                className={cn(
                  "group relative",
                  message.role === "user" && "flex-row-reverse"
                )}
              >
                {/* Avatar */}
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  message.role === "user" 
                    ? "bg-blue-500" 
                    : "bg-gradient-to-br from-blue-500 to-purple-600"
                )}>
                  {message.role === "user" ? (
                    <IconUser className="w-5 h-5 text-white" />
                  ) : (
                    <IconRobot className="w-5 h-5 text-white" />
                  )}
                </div>

                {/* Content */}
                <div className={cn(
                  "flex-1 space-y-2",
                  message.role === "user" && "flex justify-end"
                )}>
                  {message.role === "assistant" ? (
                    <Response>
                      {/* Handle different content types */}
                      {message.toolInvocations?.map((tool: any) => (
                        <Tool
                          key={tool.toolCallId}
                          name={tool.toolName}
                          state={tool.state}
                        >
                          {tool.state === "result" && tool.result}
                        </Tool>
                      ))}
                      
                      {/* Main content with markdown support */}
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {message.content.split("```").map((part: string, i: number) => {
                          if (i % 2 === 1) {
                            const [lang, ...code] = part.split("\n");
                            return (
                              <CodeBlock
                                key={i}
                                language={lang}
                                code={code.join("\n")}
                              />
                            );
                          }
                          return <div key={i} dangerouslySetInnerHTML={{ __html: part.replace(/\n/g, "<br />") }} />;
                        })}
                      </div>

                      {/* Actions for assistant messages */}
                      <Actions className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(message.content, message.id)}
                          className="gap-1"
                        >
                          {copiedMessageId === message.id ? (
                            <>
                              <IconCheck className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <IconCopy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </Button>
                        {index === messages.length - 1 && !isLoading && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRetry}
                            className="gap-1"
                          >
                            <IconRefresh className="w-3 h-3" />
                            Retry
                          </Button>
                        )}
                      </Actions>
                    </Response>
                  ) : (
                    <div className={cn(
                      "inline-block px-4 py-2 rounded-lg",
                      "bg-blue-500 text-white"
                    )}>
                      {message.content}
                    </div>
                  )}
                </div>
              </Message>
            ))
          )}

          {/* Loading state */}
          {isLoading && (
            <Message role="assistant">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                <IconRobot className="w-5 h-5 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <Loader />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </Message>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-lg text-sm">
              {error.message || "Something went wrong. Please try again."}
            </div>
          )}
        </Conversation>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <PromptInput
            value={input}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <IconLoader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <IconSend className="w-4 h-4" />
                Send
              </>
            )}
          </Button>
        </form>
        
        {/* Helper text */}
        <p className="text-xs text-muted-foreground mt-2 text-center">
          AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}