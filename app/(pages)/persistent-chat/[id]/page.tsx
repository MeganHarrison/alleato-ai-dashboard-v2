import { loadChat, getChat, getChats } from "@/lib/ai-sdk5/db/actions";
import { EnhancedChat } from "@/components/ai-sdk5/enhanced-chat";
import { ChatLayout } from "@/components/ai-sdk5/chat-layout";

export default async function ChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ prompt?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // Try to get the chat, but don't fail if it doesn't exist
  // This allows creating new chats with any ID
  await getChat(resolvedParams.id);
  
  // For now, allow non-existent chats to work (they'll be created on first message)
  // In production, you might want to check if the ID format is valid
  // or create the chat record here
  
  const messages = await loadChat(resolvedParams.id) || [];
  const chats = await getChats() || [];

  return (
    <ChatLayout chats={chats} currentChatId={resolvedParams.id}>
      <EnhancedChat 
        id={resolvedParams.id} 
        initialMessages={messages} 
        initialPrompt={resolvedSearchParams?.prompt}
      />
    </ChatLayout>
  );
}