import { openai } from "@ai-sdk/openai";
import { saveChat } from "@/lib/ai-sdk5/db/actions";
import { 
  streamText, 
  Message, 
  generateId
} from "ai";

const PROJECT_MANAGER_SYSTEM_PROMPT = `You are an experienced Senior Project Manager and Business Strategist with deep expertise in analyzing meeting transcripts and providing actionable insights. 

Your role is to:
1. Analyze meeting discussions to identify key decisions, risks, and opportunities
2. Track action items and project progress across meetings
3. Provide strategic recommendations based on patterns in team discussions
4. Surface important but potentially overlooked topics from meetings
5. Help prioritize initiatives based on meeting content and business impact

You have access to a comprehensive database of meeting transcripts, insights, and analytics. When answering questions:
- Always search for relevant meeting content to ground your responses in actual discussions
- Cite specific meetings and dates when referencing decisions or discussions
- Identify patterns and trends across multiple meetings when relevant
- Provide actionable recommendations, not just summaries
- Highlight risks, blockers, and opportunities proactively

Your communication style should be:
- Clear and concise, focusing on business value
- Data-driven, backing up insights with meeting evidence
- Strategic, connecting tactical discussions to broader business goals
- Proactive, anticipating needs and surfacing important information

Remember: You're not just summarizing meetings - you're providing strategic project management expertise based on the actual discussions and decisions made by the team.`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Request body:", JSON.stringify(body, null, 2));
    
    const { messages, chatId }: { messages: Message[]; chatId?: string } = body;

    console.log("Messages received:", messages);
    console.log("Chat ID received:", chatId);

    // Generate a chat ID if not provided (for new chats)
    const currentChatId = chatId || generateId();

    // Ensure messages is an array
    if (!Array.isArray(messages)) {
      console.error("Messages is not an array:", messages);
      return new Response("Messages must be an array", { status: 400 });
    }

    // Use messages directly (validation not available in this beta)
    const validatedMessages = messages;

    console.log("Converting messages:", validatedMessages);
    
    // Manually convert messages to the expected format for AI SDK 5
    const modelMessages = validatedMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
    
    console.log("Converted messages:", modelMessages);

    const result = await streamText({
      model: openai("gpt-4o-mini") as any, // Type workaround for AI SDK version mismatch
      system: PROJECT_MANAGER_SYSTEM_PROMPT,
      messages: modelMessages,
      // Temporarily disabled tools for testing
      // tools: {
      //   searchMeetings: searchMeetingsTool,
      //   getMeetingInsights: getMeetingInsightsTool,
      //   analyzeMeetingTrends: analyzeMeetingTrendsTool,
      //   getMeetingContext: getMeetingContextTool,
      // },
    });

    return result.toDataStreamResponse({
      init: {
        headers: {
          'Content-Type': 'text/plain',
        },
      },
      onFinish: async ({ text }: { text: string }) => {
        // Save the complete conversation including the new AI response
        try {
          const newMessage = {
            id: generateId(),
            role: 'assistant' as const,
            content: text,
          };
          const updatedMessages = [...messages, newMessage];
          await saveChat({ chatId: currentChatId, messages: updatedMessages });
        } catch (error: any) {
          console.log("Failed to save chat (user not authenticated):", error?.message || error);
          // Don't throw error - just log it for testing purposes
        }
      },
    } as any); // TypeScript workaround for AI SDK version mismatch
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

// GET handler for resuming streams (optional, for future use)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("Chat ID is required", { status: 400 });
  }

  // For now, return a simple response
  // In the future, this could be used to resume streams
  return new Response("Stream resumption not implemented", { status: 501 });
}