import { NextRequest, NextResponse } from 'next/server';
import { sendPMMessage } from '@/app/actions/pm-chat-actions';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required and cannot be empty' },
        { status: 400 }
      );
    }
    
    // Generate a chat ID if not provided
    const chatId = body.chatId || nanoid();
    
    // Call the PM chat action directly
    const response = await sendPMMessage({
      chatId,
      messages: body.messages,
    });
    
    // The response is already a Response object with streaming
    return response;
  } catch (error) {
    console.error('PM Chat Direct API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/pm-chat-direct',
    description: 'Direct PM chat endpoint using AI SDK v5',
    timestamp: new Date().toISOString(),
  });
}