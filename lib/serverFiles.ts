// lib/serverFiles.ts
import { promises as fs } from "fs";
import path from "path";

/** Read JSON from /public/... (server only) */
export async function readJsonPublic<T = any>(...parts: string[]): Promise<T> {
  const file = path.join(process.cwd(), "public", ...parts);
  const text = await fs.readFile(file, "utf-8");
  return JSON.parse(text) as T;
}

/** Read JSONL from /public/... returning an array of parsed objects (server only) */
export async function readJsonlPublic(...parts: string[]) {
  const file = path.join(process.cwd(), "public", ...parts);
  const text = await fs.readFile(file, "utf-8");
  return text
    .split(/\n+/)
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}
