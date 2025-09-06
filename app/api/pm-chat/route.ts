import { sendPMMessage } from '@/app/actions/pm-chat-actions';

// Allow streaming responses up to 60 seconds for complex RAG queries
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, chatId } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    if (!chatId) {
      return new Response('No chatId provided', { status: 400 });
    }

    // Call the PM message handler which returns a Response object
    const response = await sendPMMessage({
      chatId,
      messages,
    });

    // The sendPMMessage function returns a properly formatted Response
    return response;
  } catch (error) {
    console.error('Error in PM chat route:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}