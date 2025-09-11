import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY!
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, documentId, mode = 'project' } = body;

    // Validate input
    if (mode === 'project' && !projectId) {
      return NextResponse.json(
        { error: 'Project ID is required for project mode' },
        { status: 400 }
      );
    }

    if (mode === 'document' && !documentId) {
      return NextResponse.json(
        { error: 'Document ID is required for document mode' },
        { status: 400 }
      );
    }

    let results = {
      documentsProcessed: 0,
      insightsGenerated: 0,
      errors: [] as string[],
    };

    if (mode === 'document') {
      // Process a single document
      results = await processSingleDocument(documentId);
    } else if (mode === 'project') {
      // Process all unprocessed documents for a project
      results = await processProjectDocuments(projectId);
    } else if (mode === 'batch') {
      // Process all unprocessed documents globally (admin only)
      results = await processBatchDocuments();
    }

    return NextResponse.json({
      success: true,
      ...results,
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights', details: error },
      { status: 500 }
    );
  }
}

async function processSingleDocument(documentId: string) {
  const results = {
    documentsProcessed: 0,
    insightsGenerated: 0,
    errors: [] as string[],
  };

  try {
    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, title, content, project_id, projects(name)')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      results.errors.push(`Document not found: ${documentId}`);
      return results;
    }

    if (!document.content || document.content.length < 100) {
      results.errors.push('Document has insufficient content');
      return results;
    }

    // Check for existing insights to prevent duplicates
    const { data: existingInsights } = await supabase
      .from('ai_insights')
      .select('title, insight_type')
      .eq('project_id', document.project_id);

    const existingKeys = new Set(
      (existingInsights || []).map(i => `${i.title.toLowerCase()}:${i.insight_type}`)
    );

    // Extract insights using AI
    const insights = await extractInsightsWithAI(
      document.title,
      document.content,
      (document.projects as any)?.name || 'Unknown Project'
    );

    // Store insights
    const stored = await storeInsights(
      insights,
      document.project_id,
      documentId,
      existingKeys
    );

    results.documentsProcessed = 1;
    results.insightsGenerated = stored;

  } catch (error: any) {
    results.errors.push(`Error processing document: ${error.message}`);
  }

  return results;
}

async function processProjectDocuments(projectId: string) {
  const results = {
    documentsProcessed: 0,
    insightsGenerated: 0,
    errors: [] as string[],
  };

  try {
    // Find unprocessed documents for the project
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        content,
        project_id,
        projects(name)
      `)
      .eq('project_id', projectId)
      .is('content', 'not.null')
      .gt('length(content)', 100)
      .order('created_at', { ascending: false })
      .limit(20); // Process in batches

    if (error) {
      results.errors.push(`Failed to fetch documents: ${error.message}`);
      return results;
    }

    if (!documents || documents.length === 0) {
      results.errors.push('No documents found for processing');
      return results;
    }

    // Get existing insights for duplicate prevention
    const { data: existingInsights } = await supabase
      .from('ai_insights')
      .select('title, insight_type')
      .eq('project_id', projectId);

    const existingKeys = new Set(
      (existingInsights || []).map(i => `${i.title.toLowerCase()}:${i.insight_type}`)
    );

    // Process each document
    for (const doc of documents) {
      try {
        // Check if document already has insights
        const { data: docInsights } = await supabase
          .from('ai_insights')
          .select('id')
          .eq('document_id', doc.id)
          .limit(1);

        if (docInsights && docInsights.length > 0) {
          continue; // Skip already processed documents
        }

        const insights = await extractInsightsWithAI(
          doc.title,
          doc.content,
          (doc.projects as any)?.name || 'Unknown Project'
        );

        const stored = await storeInsights(
          insights,
          doc.project_id,
          doc.id,
          existingKeys
        );

        results.documentsProcessed++;
        results.insightsGenerated += stored;

      } catch (error: any) {
        results.errors.push(`Error with ${doc.title}: ${error.message}`);
      }
    }

  } catch (error: any) {
    results.errors.push(`Fatal error: ${error.message}`);
  }

  return results;
}

async function processBatchDocuments() {
  const results = {
    documentsProcessed: 0,
    insightsGenerated: 0,
    errors: [] as string[],
  };

  try {
    // Find all unprocessed documents
    const { data: documents, error } = await supabase
      .from('documents')
      .select(`
        id,
        title,
        content,
        project_id,
        projects(name)
      `)
      .is('content', 'not.null')
      .gt('length(content)', 100)
      .order('created_at', { ascending: false })
      .limit(50); // Process in batches

    if (error) {
      results.errors.push(`Failed to fetch documents: ${error.message}`);
      return results;
    }

    if (!documents || documents.length === 0) {
      return results;
    }

    // Group documents by project for efficient duplicate checking
    const projectDocs = new Map<string, typeof documents>();
    documents.forEach(doc => {
      if (!projectDocs.has(doc.project_id)) {
        projectDocs.set(doc.project_id, []);
      }
      projectDocs.get(doc.project_id)!.push(doc);
    });

    // Process each project's documents
    for (const [projectId, docs] of projectDocs) {
      // Get existing insights for this project
      const { data: existingInsights } = await supabase
        .from('ai_insights')
        .select('title, insight_type, document_id')
        .eq('project_id', projectId);

      const existingKeys = new Set(
        (existingInsights || []).map(i => `${i.title.toLowerCase()}:${i.insight_type}`)
      );

      const processedDocs = new Set(
        (existingInsights || []).map(i => i.document_id).filter(Boolean)
      );

      for (const doc of docs) {
        if (processedDocs.has(doc.id)) {
          continue; // Skip already processed
        }

        try {
          const insights = await extractInsightsWithAI(
            doc.title,
            doc.content,
            (doc.projects as any)?.name || 'Unknown Project'
          );

          const stored = await storeInsights(
            insights,
            doc.project_id,
            doc.id,
            existingKeys
          );

          results.documentsProcessed++;
          results.insightsGenerated += stored;

        } catch (error: any) {
          results.errors.push(`Error with ${doc.title}: ${error.message}`);
        }
      }
    }

  } catch (error: any) {
    results.errors.push(`Fatal error: ${error.message}`);
  }

  return results;
}

async function extractInsightsWithAI(
  title: string,
  content: string,
  projectName: string
): Promise<any[]> {
  // Truncate content if too long
  const maxLength = 8000;
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + '...';
  }

  const prompt = `You are an expert project manager analyzing documents for the "${projectName}" project.
        
Extract SPECIFIC, ACTIONABLE insights from this document. DO NOT generate generic observations.
Each insight must include concrete details like names, dates, amounts, and specific actions.

Document: ${title}
Content: ${content}

Extract insights in these categories:

1. ACTION ITEMS (things that need to be done):
- Include WHO needs to do it (specific name or role)
- WHAT exactly needs to be done (specific task)
- WHEN it needs to be done (date or timeframe)
- WHY it's important (impact if not done)

2. DECISIONS (choices that were made):
- What was decided
- Who made the decision
- Financial or timeline impact
- Rationale for the decision

3. RISKS (potential problems):
- Specific risk description
- Severity (critical/high/medium/low)
- Impact if it occurs
- Mitigation strategy mentioned

4. KEY FACTS (important information):
- Budget amounts mentioned
- Timeline milestones
- Technical specifications
- Stakeholder commitments

Return ONLY a JSON array with this structure:
[
  {
    "type": "action_item|decision|risk|fact",
    "title": "Brief descriptive title (max 100 chars)",
    "description": "Detailed description with all context, names, dates, amounts",
    "severity": "critical|high|medium|low",
    "assignee": "Person's name if mentioned",
    "due_date": "YYYY-MM-DD if mentioned",
    "financial_impact": "Dollar amount if mentioned",
    "confidence": 0.9
  }
]

Guidelines:
- Be SPECIFIC - use actual names, dates, amounts from the document
- NO generic insights like "Review budget" without context
- Include enough detail that someone can take action
- If no meaningful insights exist, return empty array []`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a project management expert extracting actionable insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });

    let insightsJson = response.choices[0].message.content || '[]';
    
    // Clean up the response
    insightsJson = insightsJson.trim();
    if (insightsJson.startsWith('```json')) {
      insightsJson = insightsJson.slice(7);
    }
    if (insightsJson.endsWith('```')) {
      insightsJson = insightsJson.slice(0, -3);
    }

    const insights = JSON.parse(insightsJson);

    // Validate insights
    return insights.filter((insight: any) => 
      insight.type && 
      insight.title && 
      insight.description && 
      insight.description.length >= 50
    );

  } catch (error) {
    console.error('AI extraction failed:', error);
    return [];
  }
}

async function storeInsights(
  insights: any[],
  projectId: string,
  documentId: string,
  existingKeys: Set<string>
): Promise<number> {
  let storedCount = 0;

  for (const insight of insights) {
    try {
      // Generate unique key
      const uniqueKey = `${insight.title.toLowerCase()}:${insight.type}`;
      
      // Skip if duplicate
      if (existingKeys.has(uniqueKey)) {
        continue;
      }

      // Map insight type
      const typeMapping: Record<string, string> = {
        'action_item': 'action_item',
        'decision': 'decision',
        'risk': 'risk',
        'fact': 'fact',
      };
      const insightType = typeMapping[insight.type] || 'fact';

      // Validate severity
      const validSeverities = ['critical', 'high', 'medium', 'low'];
      const severity = validSeverities.includes(insight.severity) 
        ? insight.severity 
        : 'medium';

      // Parse due date
      let dueDate = null;
      if (insight.due_date) {
        try {
          dueDate = new Date(insight.due_date).toISOString();
        } catch {
          dueDate = null;
        }
      }

      // Store insight
      const { error } = await supabase
        .from('ai_insights')
        .insert({
          project_id: projectId,
          insight_type: insightType,
          title: insight.title.substring(0, 200),
          description: insight.description,
          severity: severity,
          status: 'open',
          confidence_score: insight.confidence || 0.8,
          assignee: insight.assignee || null,
          due_date: dueDate,
          document_id: documentId,
          financial_impact: insight.financial_impact || null,
          created_at: new Date().toISOString(),
        });

      if (!error) {
        storedCount++;
        existingKeys.add(uniqueKey);
      }

    } catch (error) {
      console.error('Failed to store insight:', error);
    }
  }

  return storedCount;
}

// GET endpoint to check status
export async function GET(request: NextRequest) {
  try {
    // Get insights statistics
    const { data: stats, error } = await supabase
      .from('ai_insights')
      .select('project_id, insight_type')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    // Count by project and type
    const projectCounts = new Map<string, number>();
    const typeCounts = new Map<string, number>();

    (stats || []).forEach(insight => {
      projectCounts.set(
        insight.project_id,
        (projectCounts.get(insight.project_id) || 0) + 1
      );
      typeCounts.set(
        insight.insight_type,
        (typeCounts.get(insight.insight_type) || 0) + 1
      );
    });

    return NextResponse.json({
      success: true,
      totalRecent: stats?.length || 0,
      byProject: Object.fromEntries(projectCounts),
      byType: Object.fromEntries(typeCounts),
    });

  } catch (error) {
    console.error('Error fetching insights stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights statistics' },
      { status: 500 }
    );
  }
}