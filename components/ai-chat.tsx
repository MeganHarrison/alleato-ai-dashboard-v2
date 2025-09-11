"use client";

import type React from "react";

import { askAI } from "@/app/actions/ai-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useIsMobile, useIsSmallMobile, useViewportSize } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Bot, Maximize2, Minimize2, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! I'm your Project Management Assistant. I can help you with project insights, meeting summaries, and task management. How can I assist you today?" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Mobile-responsive hooks
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();
  const viewport = useViewportSize();

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input?.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Call the server action
      const response = await askAI(userMessage, messages);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
      console.error("Error asking AI:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate responsive dimensions
  const chatWidth = isMobile ? 
    (isSmallMobile ? "calc(100vw - 16px)" : "calc(100vw - 32px)") : 
    "380px";
  const chatHeight = isMobile ? 
    (viewport ? `${Math.min(viewport.height * 0.8, 600)}px` : "80vh") : 
    "500px";

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed shadow-lg bg-black text-white hover:bg-black/90 z-50",
          "rounded-full p-4 transition-all duration-300",
          isMobile 
            ? "bottom-6 right-6 h-16 w-16" // Larger on mobile for better touch
            : "bottom-4 right-4 h-14 w-14"
        )}
      >
        <Bot className={cn(isMobile ? "h-8 w-8" : "h-6 w-6")} />
      </Button>
    );
  }

  return (
    <Card
      className={cn(
        "fixed transition-all duration-300 shadow-xl border border-gray-200 z-50",
        isMinimized
          ? isMobile
            ? "bottom-6 right-6 h-16 w-72"
            : "bottom-4 right-4 h-14 w-64"
          : isMobile
            ? `bottom-0 left-0 right-0 mx-2 mb-2`
            : "bottom-4 right-4",
        !isMinimized && (isMobile 
          ? `h-[${chatHeight}] max-h-[80vh]`
          : "h-[500px] w-[380px]"
        )
      )}
      style={!isMinimized && isMobile ? {
        width: chatWidth,
        height: chatHeight
      } : {}}
    >
      <div className={cn(
        "flex items-center justify-between border-b border-gray-100 bg-gray-50/50",
        isMobile ? "p-4" : "p-3"
      )}>
        <div className="flex items-center space-x-2">
          <Bot className={cn(isMobile ? "h-6 w-6" : "h-5 w-5")} />
          <h3 className={cn(
            "font-medium",
            isMobile ? "text-base" : "text-sm"
          )}>PM Assistant</h3>
        </div>
        <div className="flex items-center space-x-1">
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)}
            className={cn(isMobile ? "h-10 w-10" : "h-8 w-8")}
          >
            <X className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className={cn(
            "flex-1 overflow-y-auto",
            isMobile ? "p-4" : "p-4",
            "pb-0" // Remove bottom padding since form has its own padding
          )} style={{
            height: isMobile 
              ? `calc(${chatHeight} - 120px)` // Account for header and input
              : "400px"
          }}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "mb-4 rounded-xl transition-all duration-200",
                  isMobile ? "max-w-[90%] p-4" : "max-w-[85%] p-3",
                  message.role === "user"
                    ? "ml-auto bg-black text-white shadow-lg"
                    : "bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm border border-gray-200"
                )}
              >
                <div className={cn(
                  "break-words",
                  isMobile ? "text-sm leading-relaxed" : "text-sm"
                )}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={cn(
                "bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200 mb-4",
                isMobile ? "max-w-[90%] p-4" : "max-w-[85%] p-3"
              )}>
                <div className="flex space-x-2 items-center">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-75" />
                    <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce delay-150" />
                  </div>
                  <span className="text-xs text-gray-500">PM Assistant is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className={cn(
              "border-t border-gray-100 bg-white/80 backdrop-blur-sm",
              isMobile ? "p-4 gap-3" : "p-3 gap-2",
              "flex items-center"
            )}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your data..."
              className={cn(
                "flex-1 border-gray-200 focus:border-black focus:ring-black/20",
                isMobile ? "h-12 px-4 text-base" : "h-10 px-3 text-sm"
              )}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input?.trim()}
              className={cn(
                "bg-black text-white hover:bg-black/90 shadow-lg transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isMobile ? "h-12 w-12 rounded-xl" : "h-10 w-10 rounded-lg"
              )}
            >
              <Send className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
            </Button>
          </form>
        </>
      )}
    </Card>
  );
}
