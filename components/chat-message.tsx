'use client';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FileText, Search, Upload, Bot, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  timestamp: Date;
  type?: 'text' | 'search' | 'document' | 'system';
  metadata?: unknown;
}

interface ChatMessageProps {
  message: ChatMessage;
  isOwnMessage?: boolean;
  showAvatar?: boolean;
}

export function ChatMessage({ message, isOwnMessage = false, showAvatar = true }: ChatMessageProps) {
  const initials = message.username
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getMessageIcon = () => {
    switch (message.type) {
      case 'search':
        return <Search className="h-3 w-3" />;
      case 'document':
        return <FileText className="h-3 w-3" />;
      case 'system':
        return <Bot className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const renderMessageContent = () => {
    if (message.type === 'search' && message.metadata?.results) {
      return (
        <div className="space-y-2">
          <p className="font-medium">🔍 Shared search results for: "{message.metadata.query}"</p>
          <div className="pl-4 border-l-2 border-blue-500 space-y-1">
            {message.metadata.results.slice(0, 3).map((result: unknown, idx: number) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">[{(result.similarity * 100).toFixed(0)}%]</span>{' '}
                <span className="text-muted-foreground">
                  {result.content.substring(0, 100)}...
                </span>
              </div>
            ))}
            {message.metadata.results.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{message.metadata.results.length - 3} more results
              </p>
            )}
          </div>
        </div>
      );
    }

    if (message.type === 'document' && message.metadata?.document) {
      return (
        <div className="space-y-2">
          <p className="font-medium">📄 Shared document</p>
          <Card className="p-3 bg-muted/50">
            <p className="text-sm font-medium">{message.metadata.document.fileName}</p>
            <p className="text-xs text-muted-foreground">
              {message.metadata.document.wordCount} words • {message.metadata.document.fileType}
            </p>
            {message.metadata.document.preview && (
              <p className="text-sm mt-2 italic">
                "{message.metadata.document.preview.substring(0, 150)}..."
              </p>
            )}
          </Card>
        </div>
      );
    }

    return <p className="text-sm">{message.message}</p>;
  };

  return (
    <div
      className={cn(
        'flex gap-3 group',
        isOwnMessage && 'flex-row-reverse'
      )}
    >
      {showAvatar && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.username}`} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      )}
      
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[70%]',
          isOwnMessage && 'items-end'
        )}
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium">{message.username}</span>
          {message.type && message.type !== 'text' && (
            <Badge variant="outline" className="gap-1 py-0 px-1">
              {getMessageIcon()}
              <span>{message.type}</span>
            </Badge>
          )}
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            {formatDistanceToNow(message.timestamp, { addSuffix: true })}
          </span>
        </div>
        
        <div
          className={cn(
            'rounded-lg px-3 py-2',
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted',
            message.type === 'system' && 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          )}
        >
          {renderMessageContent()}
        </div>
      </div>
    </div>
  );
}