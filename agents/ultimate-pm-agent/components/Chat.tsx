"use client";
import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Chat({ projectId }: { projectId?: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [prevId, setPrevId] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const send = async () => {
    const next = [...messages, { role: "user", content: input }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/pm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          previous_response_id: prevId,
          projectId,
        }),
      });
      const data = await res.json();
      const output =
        data?.output_text ??
        data?.output?.[0]?.content?.[0]?.text ??
        "[no output]";
      setMessages([...next, { role: "assistant", content: output }]);
      if (data?.id) setPrevId(data.id);
    } catch (e: any) {
      setMessages([
        ...next,
        { role: "assistant", content: "Error: " + (e?.message || "unknown") },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="border rounded p-3 h-96 overflow-auto bg-white">
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "text-blue-700" : "text-slate-900"}
          >
            <b>{m.role}:</b> {m.content}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask the PM…"
        />
        <button
          disabled={loading}
          onClick={send}
          className="px-4 py-2 rounded bg-black text-white"
        >
          Send
        </button>
      </div>
    </div>
  );
}
