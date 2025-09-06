"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect } from "react";

export function DebugEnhancedChat() {
  const chatResult = useChat({
    api: "/api/pm-chat",
  });

  useEffect(() => {
    console.log("useChat result:", chatResult);
    console.log("Available methods:", Object.keys(chatResult));
    console.log("handleSubmit exists?", 'handleSubmit' in chatResult);
    console.log("submit exists?", 'submit' in chatResult);
  }, [chatResult]);

  return (
    <div className="p-8">
      <h2>Debug useChat Hook</h2>
      <pre className="mt-4 p-4 bg-gray-100 rounded">
        {JSON.stringify(Object.keys(chatResult), null, 2)}
      </pre>
      <div className="mt-4">
        <p>Check console for detailed output</p>
      </div>
    </div>
  );
}