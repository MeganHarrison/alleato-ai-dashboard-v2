'use server';

import { createClient } from '@supabase/supabase-js';
import { InsightGenerator } from '@/monorepo-agents/pm-rag-vectorize/lib/ai/agents/insight-generator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface GenerateInsightsOptions {
  documentId: string;
  forceRegenerate?: boolean;
  projectId?: number;
}

export async function generateDocumentInsights(options: GenerateInsightsOptions) {
  const { documentId, forceRegenerate = false, projectId } = options;
  
  try {
    // Check if insights already exist
    if (!forceRegenerate) {
      const { data: existingInsights } = await supabase
        .from('ai_insights')
        .select('id')
        .eq('document_id', documentId)
        .limit(1);

      if (existingInsights && existingInsights.length > 0) {
        return {
          success: true,
          message: 'Insights already exist for this document',
          data: { 
            insightsGenerated: 0,
            summaryGenerated: false,
            skipped: true
          }
        };
      }
    }

    // Generate new insights
    const insightGenerator = new InsightGenerator();
    const result = await insightGenerator.generateDocumentInsights(documentId);

    // If project ID is provided, update the insights with it
    if (projectId && result.success) {
      await supabase
        .from('ai_insights')
        .update({ project_id: projectId })
        .eq('document_id', documentId);
    }

    return {
      success: result.success,
      message: result.success 
        ? `Generated ${result.insightsGenerated} insights successfully`
        : 'Failed to generate insights',
      data: result
    };

  } catch (error) {
    console.error('Error in generateDocumentInsights:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {
        success: false,
        insightsGenerated: 0,
        summaryGenerated: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

export async function generateBatchInsights(
  documentIds: string[], 
  options: { forceRegenerate?: boolean } = {}
) {
  const results = [];
  
  for (const documentId of documentIds) {
    try {
      const result = await generateDocumentInsights({
        documentId,
        forceRegenerate: options.forceRegenerate
      });
      results.push(result);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({
        success: false,
        message: `Failed for document ${documentId}`,
        data: {
          success: false,
          insightsGenerated: 0,
          summaryGenerated: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }
  
  const totalInsights = results.reduce(
    (sum, r) => sum + (r.data.insightsGenerated || 0), 
    0
  );
  
  return {
    success: results.some(r => r.success),
    message: `Generated ${totalInsights} insights from ${documentIds.length} documents`,
    data: {
      results,
      totalInsights,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length
    }
  };
}

// Function to automatically generate insights after document processing
export async function autoGenerateInsightsAfterProcessing(documentId: string) {
  try {
    // Wait a bit to ensure document processing is complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if document has been vectorized (has chunks)
    const { data: chunks } = await supabase
      .from('chunks')
      .select('id')
      .eq('document_id', documentId)
      .limit(1);

    if (!chunks || chunks.length === 0) {
      console.log('No chunks found, skipping insight generation');
      return {
        success: false,
        message: 'Document not yet vectorized',
        data: null
      };
    }

    // Generate insights
    return await generateDocumentInsights({ documentId });
    
  } catch (error) {
    console.error('Error in autoGenerateInsightsAfterProcessing:', error);
    return {
      success: false,
      message: 'Failed to auto-generate insights',
      data: null
    };
  }
}