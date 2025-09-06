"use client";

import { MyUIMessage } from "@/lib/ai-sdk5/types/message-types";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User, Bot, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface MessageProps {
  message: MyUIMessage;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 p-4",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">
            {isUser ? "You" : "Assistant"}
          </span>
          {message.createdAt && (
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), "h:mm a")}
            </span>
          )}
        </div>
        
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {message.parts.map((part, index) => (
            <div key={index}>
              {part.type === "text" && (
                <p className="whitespace-pre-wrap">{part.text}</p>
              )}
              
              {part.type === "reasoning" && (
                <div className="bg-muted/30 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {part.text}
                  </p>
                </div>
              )}
              
              {part.type === "file" && (
                <div className="bg-muted rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">File:</span>
                    <span className="text-sm">{part.filename || "Unnamed file"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {part.mediaType}
                  </span>
                </div>
              )}
              
              {part.type.startsWith("tool-") && (
                <div className="bg-muted/30 rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium">
                      Tool: {part.type.substring(5)}
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        (part as any).state === "pending" && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                        (part as any).state === "partial" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                        (part as any).state === "result" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                        (part as any).state === "failed" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      )}
                    >
                      {(part as any).state}
                    </span>
                  </div>
                  
                  {(part as any).input && (
                    <div className="text-xs mb-1">
                      <span className="font-medium">Input:</span>
                      <pre className="mt-1 overflow-x-auto">
                        {JSON.stringify((part as any).input, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {(part as any).result && (
                    <div className="text-xs">
                      <span className="font-medium">Result:</span>
                      <pre className="mt-1 overflow-x-auto">
                        {JSON.stringify((part as any).result, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {(part as any).errorText && (
                    <div className="flex items-start gap-2 mt-2">
                      <AlertCircle className="h-3 w-3 text-red-500 mt-0.5" />
                      <span className="text-xs text-red-500">
                        {(part as any).errorText}
                      </span>
                    </div>
                  )}
                </div>
              )}
              
              {part.type === "source_url" && (
                <div className="text-sm mb-2">
                  <a
                    href={part.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    {part.title || part.url}
                  </a>
                </div>
              )}
              
              {part.type === "source_document" && (
                <div className="bg-muted rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Document:</span>
                    <span className="text-sm">{part.title}</span>
                  </div>
                  {part.filename && (
                    <span className="text-xs text-muted-foreground">
                      {part.filename}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}