import { NextRequest, NextResponse } from 'next/server';

// Simple basic API endpoint - agents functionality disabled for now
export async function GET() {
  return NextResponse.json({ 
    message: 'Basic API endpoint', 
    status: 'active',
    timestamp: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    return NextResponse.json({
      message: 'Basic API endpoint received POST request',
      receivedData: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Basic API error:', error);
    return NextResponse.json(
      { error: 'Invalid request data' },
      { status: 400 }
    );
  }
}