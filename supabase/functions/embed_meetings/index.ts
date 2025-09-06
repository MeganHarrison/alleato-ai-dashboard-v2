/**
 * Edge Function: embed_meetings
 *
 * Scheduled to run every 30 minutes.
 * Deploy: supabase functions deploy embed_meetings
 * Schedule: supabase functions schedule embed_meetings --cron "*/30 * * * *"
 *
 * Requirements:
 * - @supabase/supabase-js@2.39.2   (client library)
 * - @supabase/ai@0.1.0            (embedding API)
 *
 * Environment variables are provided automatically:
 * SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 */

import { createClient } from "npm:@supabase/supabase-js@2.39.2";
import { OpenAI } from "npm:@supabase/ai@0.1.0";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role bypasses RLS for internal work
);

/**
 * Simple sentence‑wise splitter.
 * Real‑world use‑cases may prefer a library like `langchain` or a custom tokenizer.
 */
function splitIntoChunks(text: string, maxTokens = 500): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const s of sentences) {
    // rough token estimate: 1 token ≈ 4 characters
    const projected = (current + " " + s).length / 4;
    if (projected > maxTokens && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += " " + s;
    }
  }
  if (current) chunks.push(current.trim());
  return chunks;
}

/**
 * Main handler – executed by the cron scheduler.
 */
export const handler = async (req: Request): Promise<Response> => {
  // 1️⃣ Fetch meetings that need embedding
  const { data: meetings, error: fetchErr } = await supabase
    .from("meetings")
    .select("id, transcript_url, storage_bucket_path")
    .eq("processing_status", "pending")
    .limit(10); // limit batch size – tune as needed

  if (fetchErr) {
    console.error("Failed to fetch pending meetings:", fetchErr);
    return new Response(JSON.stringify({ error: fetchErr.message }), { status: 500 });
  }

  if (!meetings || meetings.length === 0) {
    return new Response(JSON.stringify({ message: "No pending meetings." }), { status: 200 });
  }

  // 2️⃣ Process each meeting sequentially (you can parallelise with Promise.all if desired)
  for (const meeting of meetings) {
    const meetingId = meeting.id as string;
    console.log(`Processing meeting ${meetingId}`);

    // Mark as "processing" to avoid duplicate work
    await supabase
      .from("meetings")
      .update({ processing_status: "processing" })
      .eq("id", meetingId);

    try {
      // 2a️⃣ Download transcript from storage
      const bucket = supabase.storage.from("meetings");
      const { data: fileData, error: downloadErr } = await bucket.download(
        meeting.storage_bucket_path || meeting.transcript_url || ""
      );

      if (downloadErr || !fileData) throw new Error(`Download failed: ${downloadErr?.message}`);

      const transcript = new TextDecoder().decode(fileData);
      const chunks = splitIntoChunks(transcript);

      // 2b️⃣ Create an OpenAI embedding model (you can swap to any model Supabase AI supports)
      const embeddingModel = new OpenAI("text-embedding-3-large");

      // 2c️⃣ Loop through chunks, embed, and store
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const { data: vectors, error: embedErr } = await embeddingModel.run(
          chunk,
          { normalize: true, mean_pool: true }
        );

        if (embedErr) throw new Error(`Embedding error: ${embedErr.message}`);

        // Store vector + metadata
        await supabase.from("meeting_embeddings").insert({
          meeting_id: meetingId,
          chunk_index: i,
          embedding: vectors,
          metadata: {
            text: chunk,
            // optional extra fields:
            // start_timestamp: ...,
            // speaker: ...
          },
        });
      }

      // 2d️⃣ Mark meeting as completed
      await supabase
        .from("meetings")
        .update({ processing_status: "completed", processed_at: new Date().toISOString() })
        .eq("id", meetingId);
    } catch (e) {
      console.error(`Failed to embed meeting ${meetingId}:`, e);
      await supabase
        .from("meetings")
        .update({
          processing_status: "failed",
          processing_error: (e as Error).message,
        })
        .eq("id", meetingId);
    }
  }

  return new Response(JSON.stringify({ message: "Embedding run completed." }), { status: 200 });
};