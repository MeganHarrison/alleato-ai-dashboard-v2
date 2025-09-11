import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface InsightData {
  summary?: string;
  key_points?: string[];
  action_items?: string[];
  decisions?: string[];
  risks?: string[];
  questions?: string[];
  participants?: string[];
  next_steps?: string[];
  sentiment?: string;
  priority?: string;
  confidence?: number;
}

async function generateInsightsForDocument(doc: unknown): Promise<InsightData> {
  try {
    const systemPrompt = `You are an AI assistant specialized in analyzing documents and extracting actionable insights. 
    Analyze the provided document content and extract:
    - A concise summary
    - Key points and takeaways
    - Action items that need to be completed
    - Important decisions made
    - Identified risks or concerns
    - Open questions that need answers
    - Next steps
    - Overall sentiment (positive, neutral, negative)
    - Priority level (high, medium, low)
    
    Format your response as a JSON object with these fields.`;

    const userPrompt = `Analyze this document and extract insights:
    
    Title: ${doc.title || 'Untitled'}
    Content: ${doc.content || ''}
    
    Provide actionable insights in JSON format.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    });

    const insights = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      summary: insights.summary || '',
      key_points: insights.key_points || [],
      action_items: insights.action_items || [],
      decisions: insights.decisions || [],
      risks: insights.risks || [],
      questions: insights.questions || [],
      participants: insights.participants || [],
      next_steps: insights.next_steps || [],
      sentiment: insights.sentiment || 'neutral',
      priority: insights.priority || 'medium',
      confidence: insights.confidence || 0.75,
    };
  } catch (error) {
    console.error('Error generating insights with OpenAI:', error);
    // Return basic insights if AI generation fails
    return {
      summary: doc.content ? doc.content.substring(0, 200) + '...' : 'No content available',
      key_points: [],
      action_items: [],
      decisions: [],
      risks: [],
      questions: [],
      participants: [],
      next_steps: [],
      sentiment: 'neutral',
      priority: 'medium',
      confidence: 0.5,
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentId, documentIds, source = 'manual' } = body;

    if (!documentId && !documentIds) {
      return NextResponse.json(
        { error: 'Either documentId or documentIds must be provided' },
        { status: 400 }
      );
    }

    // Determine which documents to process
    const idsToProcess = documentIds || [documentId];
    
    // Fetch documents from database
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .in('id', idsToProcess);

    if (fetchError) {
      throw fetchError;
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json(
        { error: 'No documents found' },
        { status: 404 }
      );
    }

    // Process each document
    const results = [];
    for (const doc of documents) {
      try {
        // Generate insights
        const insights = await generateInsightsForDocument(doc);
        
        // Update document metadata with insights
        const updatedMetadata = {
          ...(doc.metadata || {}),
          ai_insights: insights,
          ai_generated: true,
          ai_generated_at: new Date().toISOString(),
          ai_summary: insights.summary,
        };

        // Update document in database
        const { error: updateError } = await supabase
          .from('documents')
          .update({ metadata: updatedMetadata })
          .eq('id', doc.id);

        if (updateError) {
          console.error(`Failed to update document ${doc.id}:`, updateError);
          results.push({ id: doc.id, success: false, error: updateError.message });
        } else {
          results.push({ id: doc.id, success: true, insights });
        }

        // Optional: Store insights in a separate table if it exists
        try {
          await supabase
            .from('ai_insights')
            .upsert({
              document_id: doc.id,
              insights: insights,
              generated_at: new Date().toISOString(),
              source: source,
            }, {
              onConflict: 'document_id'
            });
        } catch (insightTableError) {
          // Ignore if ai_insights table doesn't exist
          console.log('ai_insights table not available, stored in document metadata only');
        }

      } catch (docError) {
        console.error(`Error processing document ${doc.id}:`, docError);
        results.push({ 
          id: doc.id, 
          success: false, 
          error: docError instanceof Error ? docError.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      processed: successCount,
      failed: failureCount,
      results: results,
      message: `Insights generated successfully for ${successCount} document(s)${failureCount > 0 ? `, ${failureCount} failed` : ''}`
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate insights' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check insight generation status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // First try to get from ai_insights table if it exists
    try {
      const query = supabase
        .from('ai_insights')
        .select(`
          *,
          documents(title, source, created_at),
          projects(name, phase)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error } = await query;

      if (!error && data) {
        return NextResponse.json({
          success: true,
          data: data,
          count: data.length,
          source: 'ai_insights_table'
        });
      }
    } catch (tableError) {
      console.log('ai_insights table not available, fetching from documents metadata');
    }

    // Fallback to getting insights from document metadata
    const query = supabase
      .from('documents')
      .select('*')
      .not('metadata->ai_insights', 'is', null)
      .order('id', { ascending: false })
      .limit(limit);

    if (documentId) {
      query = query.eq('id', documentId);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform documents to match expected insight format
    const insights = data?.map(doc => ({
      document_id: doc.id,
      insights: doc.metadata?.ai_insights || {},
      generated_at: doc.metadata?.ai_generated_at || null,
      source: 'document_metadata',
      document: {
        title: doc.metadata?.title || `Document ${doc.id}`,
        content: doc.content,
        created_at: doc.metadata?.created_at || null
      }
    })) || [];

    return NextResponse.json({
      success: true,
      data: insights,
      count: insights.length,
      source: 'document_metadata'
    });

  } catch (error) {
    console.error('Error fetching insights:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch insights' 
      },
      { status: 500 }
    );
  }
}