import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
  console.error('Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const openai = new OpenAI({ apiKey: openaiApiKey });

// Function to chunk text
function chunkText(text: string, maxChunkSize = 1000): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Function to generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 384, // Use smaller dimension for cost efficiency
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Main function to process meetings
async function processMeetings() {
  console.log('🚀 Starting meeting vectorization...\n');

  // Fetch all meetings
  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .order('date', { ascending: false });

  if (meetingsError) {
    console.error('Error fetching meetings:', meetingsError);
    return;
  }

  if (!meetings || meetings.length === 0) {
    console.log('No meetings found to process');
    return;
  }

  console.log(`Found ${meetings.length} meetings to process\n`);

  // Process each meeting
  for (const meeting of meetings) {
    console.log(`\n📄 Processing: ${meeting.title}`);

    // Check if already processed
    const { data: existingEmbeddings } = await supabase
      .from('meeting_embeddings')
      .select('id')
      .eq('meeting_id', meeting.id)
      .limit(1);

    if (existingEmbeddings && existingEmbeddings.length > 0) {
      console.log('  ⏭️  Already processed, skipping...');
      continue;
    }

    // Combine meeting content for embedding
    const contentParts = [
      `Meeting: ${meeting.title}`,
      meeting.summary && `Summary: ${meeting.summary}`,
      meeting.action_items?.length > 0 && `Action Items: ${meeting.action_items.join(', ')}`,
      meeting.decisions?.length > 0 && `Decisions: ${meeting.decisions.join(', ')}`,
      meeting.risks?.length > 0 && `Risks: ${meeting.risks.join(', ')}`,
      meeting.participants?.length > 0 && `Participants: ${meeting.participants.join(', ')}`,
    ].filter(Boolean).join('\n\n');

    // Create chunks
    const chunks = chunkText(contentParts);
    console.log(`  📝 Created ${chunks.length} chunks`);

    // Generate embeddings for each chunk
    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`  🔄 Generating embedding for chunk ${i + 1}/${chunks.length}`);
        const embedding = await generateEmbedding(chunks[i]);

        // Format embedding for PostgreSQL
        const embeddingStr = `[${embedding.join(',')}]`;

        // Store in database
        const { error: insertError } = await supabase
          .from('meeting_embeddings')
          .insert({
            meeting_id: meeting.id,
            chunk_index: i,
            content: chunks[i],
            embedding_vector: embeddingStr,
            metadata: {
              meeting_title: meeting.title,
              meeting_date: meeting.date,
              chunk_position: `${i + 1} of ${chunks.length}`,
            },
          });

        if (insertError) {
          console.error(`  ❌ Error storing embedding:`, insertError);
        } else {
          console.log(`  ✅ Stored embedding for chunk ${i + 1}`);
        }

        // Rate limiting - OpenAI has rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`  ❌ Error processing chunk ${i + 1}:`, error);
      }
    }

    console.log(`  ✅ Completed processing: ${meeting.title}`);
  }

  console.log('\n✅ Vectorization complete!');
}

// Test function to verify embeddings work
async function testVectorSearch() {
  console.log('\n🧪 Testing vector search...\n');

  const testQuery = 'action items and decisions';
  console.log(`Test query: "${testQuery}"`);

  try {
    // Generate embedding for test query
    const queryEmbedding = await generateEmbedding(testQuery);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Test the match_meeting_chunks function
    const { data, error } = await supabase.rpc('match_meeting_chunks', {
      query_embedding: embeddingStr,
      match_threshold: 0.3,
      match_count: 3,
    });

    if (error) {
      console.error('Vector search error:', error);
      
      // Try text-based fallback
      console.log('\nTrying text-based search fallback...');
      const { data: textResults, error: textError } = await supabase
        .from('meetings')
        .select('id, title, summary')
        .or(`title.ilike.%${testQuery}%,summary.ilike.%${testQuery}%`)
        .limit(3);

      if (textResults) {
        console.log('Text search results:', textResults);
      }
    } else if (data && data.length > 0) {
      console.log(`\n✅ Vector search successful! Found ${data.length} results:`);
      data.forEach((result: any, index: number) => {
        console.log(`\n${index + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`   Content: ${result.content.substring(0, 100)}...`);
      });
    } else {
      console.log('\n⚠️ No results found. This might be normal if no relevant content exists.');
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test-only')) {
    await testVectorSearch();
  } else {
    await processMeetings();
    console.log('\n---');
    await testVectorSearch();
  }
}

// Run the script
main().catch(console.error);