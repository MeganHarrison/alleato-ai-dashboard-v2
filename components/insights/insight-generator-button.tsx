'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useInsightGeneration } from '@/hooks/use-insight-generation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface InsightGeneratorButtonProps {
  documentId?: string;
  documentIds?: string[];
  onComplete?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function InsightGeneratorButton({
  documentId,
  documentIds,
  onComplete,
  variant = 'default',
  size = 'default',
  className,
}: InsightGeneratorButtonProps) {
  const [open, setOpen] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  
  const { generateInsights, generateBatchInsights, isGenerating, progress } = 
    useInsightGeneration({
      onSuccess: (result) => {
        // Animate progress to 100%
        setProgressValue(100);
        setTimeout(() => {
          setOpen(false);
          setProgressValue(0);
          if (onComplete) {
            onComplete();
          }
        }, 1500);
      },
      onError: () => {
        setProgressValue(0);
      }
    });

  const handleGenerate = async () => {
    setProgressValue(20);
    
    if (documentIds && documentIds.length > 0) {
      // Batch processing
      await generateBatchInsights(documentIds);
    } else if (documentId) {
      // Single document
      await generateInsights(documentId);
    }
  };

  // Update progress animation
  if (isGenerating && progressValue < 80) {
    setTimeout(() => setProgressValue(prev => Math.min(prev + 10, 80)), 500);
  }

  const isDisabled = !documentId && (!documentIds || documentIds.length === 0);
  const buttonText = documentIds && documentIds.length > 1 
    ? `Generate Insights (${documentIds.length})` 
    : 'Generate Insights';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={className}
          disabled={isDisabled}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generating AI Insights</DialogTitle>
          <DialogDescription>
            {documentIds && documentIds.length > 1
              ? `Processing ${documentIds.length} documents to extract actionable insights...`
              : 'Analyzing document to extract actionable insights, decisions, and risks...'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progressValue}%</span>
            </div>
            <Progress value={progressValue} className="h-2" />
          </div>
          
          {progress && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{progress}</span>
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1">
            <p>The AI will analyze the document to identify:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Action items and assignments</li>
              <li>Key decisions and rationale</li>
              <li>Risks and mitigation strategies</li>
              <li>Important topics and sentiment</li>
              <li>Unanswered questions</li>
            </ul>
          </div>
        </div>
        
        {!isGenerating && (
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Start Generation
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}