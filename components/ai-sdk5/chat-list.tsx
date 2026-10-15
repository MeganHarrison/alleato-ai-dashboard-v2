"use client";

import { Chat } from "@/lib/ai-sdk5/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { deleteChat } from "@/lib/ai-sdk5/db/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

interface ChatListProps {
  chats: Chat[];
}

export function ChatList({ chats }: ChatListProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this chat?")) {
      return;
    }

    setDeletingId(chatId);
    try {
      await deleteChat(chatId);
      toast.success("Chat deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete chat");
      console.error("Error deleting chat:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNewChat = () => {
    router.push("/persistent-chat");
  };

  if (chats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Chats Yet</CardTitle>
          <CardDescription>
            Start a new conversation to see it appear here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleNewChat} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Start New Chat
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Project Manager AI Sessions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-powered insights from your meeting transcripts
          </p>
        </div>
        <Button onClick={handleNewChat}>
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>
      
      <ScrollArea className="h-[600px]">
        <div className="space-y-2 pr-4">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/persistent-chat/${chat.id}`}
              className="block"
            >
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">
                        Chat {chat.id}
                      </CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => handleDelete(chat.id, e)}
                      disabled={deletingId === chat.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    ID: {chat.id}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}