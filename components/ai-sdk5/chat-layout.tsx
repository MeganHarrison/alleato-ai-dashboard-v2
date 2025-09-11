"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  PanelLeftIcon, 
  MessageSquarePlusIcon, 
  MoreHorizontalIcon,
  PencilIcon,
  TrashIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Chat as ChatType } from "@/lib/ai-sdk5/types/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatLayoutProps {
  children: React.ReactNode;
  chats: ChatType[];
  currentChatId?: string;
}

interface ChatSidebarProps {
  chats: ChatType[];
  currentChatId?: string;
  onChatSelect?: (chatId: string) => void;
}

function ChatSidebar({ chats, currentChatId }: ChatSidebarProps) {
  return (
    <div className="flex h-full w-full flex-col">
      {/* New Chat Button */}
      <div className="p-3">
        <Link href="/persistent-chat?new=true">
          <Button variant="outline" className="w-full justify-start gap-2">
            <MessageSquarePlusIcon className="h-4 w-4" />
            New Chat
          </Button>
        </Link>
      </div>

      <Separator />

      {/* Chat History */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-3">
          {chats.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No chats yet
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center justify-between rounded-lg p-2 text-sm transition-colors hover:bg-accent",
                  currentChatId === chat.id && "bg-accent"
                )}
              >
                <Link 
                  href={`/persistent-chat/${chat.id}`}
                  className="flex-1 truncate font-medium"
                >
                  {chat.title || `Chat ${chat.id.slice(0, 8)}...`}
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    >
                      <MoreHorizontalIcon className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <PencilIcon className="mr-2 h-3 w-3" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <TrashIcon className="mr-2 h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-medium">U</span>
          </div>
          <span>Project Manager AI</span>
        </div>
      </div>
    </div>
  );
}

export function ChatLayout({ children, chats, currentChatId }: ChatLayoutProps) {
  const [sidebarOpen] = useState(false);
  return (
    <div className="flex h-screen">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 border-r bg-muted/10 md:block">
        <ChatSidebar chats={chats} currentChatId={currentChatId} />
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <ChatSidebar chats={chats} currentChatId={currentChatId} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Mobile Header */}
        <div className="flex items-center gap-2 border-b p-4 md:hidden">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <PanelLeftIcon className="h-4 w-4" />
              </Button>
            </SheetTrigger>
          </Sheet>
          <h1 className="text-lg font-semibold">Project Manager AI</h1>
        </div>

        {/* Chat Content */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}