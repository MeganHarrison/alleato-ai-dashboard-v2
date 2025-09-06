import { NextRequest, NextResponse } from 'next/server';
import { VectorStore } from '@/lib/vector/vector-store';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const vectorStore = new VectorStore();

    switch (action) {
      case 'store':
        const { document } = params;
        if (!document || !document.content) {
          return NextResponse.json({ error: 'Document content is required' }, { status: 400 });
        }
        const storeResult = await vectorStore.storeDocument(document);
        return NextResponse.json(storeResult);

      case 'storeBatch':
        const { documents } = params;
        if (!documents || !Array.isArray(documents)) {
          return NextResponse.json({ error: 'Documents array is required' }, { status: 400 });
        }
        const batchResult = await vectorStore.storeDocuments(documents);
        return NextResponse.json(batchResult);

      case 'search':
        const { query, matchThreshold, matchCount } = params;
        if (!query) {
          return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }
        const searchResult = await vectorStore.semanticSearch(query, {
          matchThreshold,
          matchCount
        });
        return NextResponse.json(searchResult);

      case 'searchMeetings':
        const { query: meetingQuery, matchThreshold: meetingThreshold, matchCount: meetingCount } = params;
        if (!meetingQuery) {
          return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }
        const meetingResult = await vectorStore.searchMeetingChunks(meetingQuery, {
          matchThreshold: meetingThreshold,
          matchCount: meetingCount
        });
        return NextResponse.json(meetingResult);

      case 'updateMeetingEmbeddings':
        const { batchSize = 10 } = params;
        const updateResult = await vectorStore.updateMeetingChunkEmbeddings(batchSize);
        return NextResponse.json(updateResult);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Vector API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const vectorStore = new VectorStore();
    const result = await vectorStore.getDocument(parseInt(id));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Vector GET API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const vectorStore = new VectorStore();
    const result = await vectorStore.deleteDocument(parseInt(id));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Vector DELETE API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}