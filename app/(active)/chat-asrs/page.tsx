"use client";

import { AIElementsChat } from "@/components/chat/ai-elements-chat";

export default function Page() {
  return (
    <div className="h-screen bg-background">
      <AIElementsChat
        api="/api/fm-global-chat"
        placeholder="Ask about FM Global documentation, ASRS requirements..."
        suggestedPrompts={[
          "What are the FM Global sprinkler requirements for ASRS?",
          "Explain shuttle ASRS protection schemes",
          "How do I calculate sprinkler spacing for mini-load systems?",
          "What's the difference between wet and dry protection systems?",
        ]}
      />
    </div>
  );
}