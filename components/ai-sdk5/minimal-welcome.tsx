"use client";

interface MinimalWelcomeProps {
  welcomeMessage?: string;
  suggestedQuestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
}

export function MinimalWelcome({ 
  welcomeMessage,
  suggestedQuestions = [],
  onSuggestionClick
}: MinimalWelcomeProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-8 text-center">
        {/* Simple welcome text */}
        <div className="space-y-2">
          <h1 className="text-lg font-normal text-foreground/80">PM Assistant</h1>
          <p className="text-sm text-muted-foreground">
            {welcomeMessage || "I analyze meeting transcripts to provide insights, track progress, and identify risks."}
          </p>
        </div>
        
        {/* Minimal suggested prompts */}
        {suggestedQuestions.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground/60">Try asking</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(question)}
                  className="rounded-full border border-border/50 px-4 py-2 text-xs text-muted-foreground transition-all hover:border-border hover:text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}