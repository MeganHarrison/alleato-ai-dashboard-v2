"use client";

import { useEffect, useState } from "react";

export default function SearchWidget() {
  const [q] = useState($2);
  const [results, setResults] = useState<any[]>([]);
  const [loading] = useState($2);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    const canceled = false;
    (async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/blocks.jsonl`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`blocks.jsonl fetch failed: ${res.status}`);
        const text = await res.text();
        if (canceled) return;
        const parsed = text
          .split(/\n+/)
          .filter(Boolean)
          .map((line) => {
            try { return JSON.parse(line); } catch { return null; }
          })
          .filter(Boolean);
        setBlocks(parsed);
      } catch (e: unknown) {
        setError(e?.message || "Failed to load blocks.jsonl");
      }
    })();
    return () => { canceled = true; };
  }, []);

  const onSearch = (evt: React.FormEvent) => {
    evt.preventDefault();
    setLoading(true);
    setError(null);
    const qn = q.trim().toLowerCase();
    const tops = qn
      ? blocks.filter((b) => typeof b.text === "string" && b.text.toLowerCase().includes(qn)).slice(0, 50)
      : [];
    setResults(tops);
    setLoading(false);
  };

  return (
    <div className="border rounded-2xl p-4 bg-white shadow-sm">
      <form onSubmit={onSearch} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search paragraphs, notes, tables..."
          className="w-full border rounded-xl px-3 py-2"
        />
        <button className="px-3 py-2 rounded-xl bg-black text-white" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
      {results.length > 0 && (
        <div className="mt-4 space-y-2">
          {results.map((r, i) => (
            <a
              key={i}
              href={`/fm-8-34/${r.section_number ? String(r.section_number).replaceAll(".", "-") : ""}${r.ordinal ? `#b${r.ordinal}` : ""}`}
              className="block border rounded-xl p-3 hover:bg-gray-50"
            >
              <div className="text-xs text-gray-500 font-mono">§{r.section_number} · p.{r.page_start}</div>
              <div className="text-sm line-clamp-3">{r.text}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}