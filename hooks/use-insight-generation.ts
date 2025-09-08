'use client';

import { useState } from 'react';
import { toast } from 'sonner';

interface InsightGenerationResult {
  success: boolean;
  insightsGenerated?: number;
  summaryGenerated?: boolean;
  error?: string;
}

interface UseInsightGenerationOptions {
  onSuccess?: (result: InsightGenerationResult) => void;
  onError?: (error: string) => void;
}

export function useInsightGeneration(options: UseInsightGenerationOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const generateInsights = async (documentId: string) => {
    setIsGenerating(true);
    setProgress('Initializing insight generation...');

    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate insights');
      }

      setProgress('Insights generated successfully!');
      toast.success(`Generated ${result.data.insightsGenerated || 0} insights`);
      
      if (options.onSuccess) {
        options.onSuccess(result.data);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate insights';
      setProgress(`Error: ${errorMessage}`);
      toast.error(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    } finally {
      setIsGenerating(false);
      // Clear progress after a delay
      setTimeout(() => setProgress(''), 3000);
    }
  };

  const generateBatchInsights = async (documentIds: string[]) => {
    setIsGenerating(true);
    setProgress(`Processing ${documentIds.length} documents...`);

    try {
      const response = await fetch('/api/insights/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentIds }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate insights');
      }

      setProgress('Batch insights generated successfully!');
      toast.success(`Processed ${documentIds.length} documents`);
      
      if (options.onSuccess) {
        options.onSuccess(result.data);
      }

      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate batch insights';
      setProgress(`Error: ${errorMessage}`);
      toast.error(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      }
      
      throw error;
    } finally {
      setIsGenerating(false);
      // Clear progress after a delay
      setTimeout(() => setProgress(''), 3000);
    }
  };

  return {
    generateInsights,
    generateBatchInsights,
    isGenerating,
    progress,
  };
}