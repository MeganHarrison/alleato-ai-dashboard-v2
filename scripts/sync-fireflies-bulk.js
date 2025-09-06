const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;
const firefliesApiKey = process.env.FIREFLIES_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !firefliesApiKey) {
  console.error('❌ Missing required environment variables');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, and FIREFLIES_API_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GraphQL query to fetch transcripts from Fireflies
const GET_TRANSCRIPTS_QUERY = `
  query GetTranscripts($limit: Int!, $skip: Int!) {
    transcripts(limit: $limit, skip: $skip) {
      id
      title
      date
      duration
      transcript
      organizer_email
      participants {
        displayName
        email
      }
      summary {
        overview
        action_items
        keywords
        outline
        shorthand_bullet
      }
      sentences {
        text
        speaker_name
        start_time
        end_time
      }
      meeting_url
      audio_url
    }
  }
`;

async function fetchFirefliesTranscripts(limit = 50, skip = 0) {
  console.log(`📥 Fetching ${limit} transcripts from Fireflies (skip: ${skip})...`);
  
  try {
    const response = await fetch('https://api.fireflies.ai/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firefliesApiKey}`,
      },
      body: JSON.stringify({
        query: GET_TRANSCRIPTS_QUERY,
        variables: { limit, skip }
      })
    });

    if (!response.ok) {
      throw new Error(`Fireflies API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data?.transcripts || [];
  } catch (error) {
    console.error('❌ Error fetching from Fireflies:', error);
    throw error;
  }
}

async function prepareTranscriptForStorage(transcript) {
  // Prepare the full transcript text
  let fullTranscript = '';
  if (transcript.sentences && transcript.sentences.length > 0) {
    fullTranscript = transcript.sentences
      .map(s => `${s.speaker_name}: ${s.text}`)
      .join('\n');
  } else if (transcript.transcript) {
    fullTranscript = transcript.transcript;
  }

  // Create a comprehensive document
  const documentContent = `
# ${transcript.title || 'Meeting Transcript'}

**Date:** ${transcript.date}
**Duration:** ${Math.round(transcript.duration / 60)} minutes
**Organizer:** ${transcript.organizer_email}
**Participants:** ${transcript.participants?.map(p => p.displayName || p.email).join(', ') || 'N/A'}

## Summary
${transcript.summary?.overview || 'No summary available'}

## Key Points
${transcript.summary?.shorthand_bullet?.join('\n- ') || 'No key points available'}

## Action Items
${transcript.summary?.action_items?.join('\n- ') || 'No action items identified'}

## Full Transcript
${fullTranscript}
`.trim();

  return {
    source: `fireflies_${transcript.id}.md`,
    content: documentContent,
    title: transcript.title || `Meeting - ${new Date(transcript.date).toLocaleDateString()}`,
    type: 'meeting_transcript',
    metadata: {
      fireflies_id: transcript.id,
      meeting_date: transcript.date,
      duration_minutes: Math.round(transcript.duration / 60),
      organizer: transcript.organizer_email,
      participants: transcript.participants?.map(p => ({
        name: p.displayName,
        email: p.email
      })),
      keywords: transcript.summary?.keywords,
      meeting_url: transcript.meeting_url,
      audio_url: transcript.audio_url,
      has_action_items: (transcript.summary?.action_items?.length || 0) > 0,
      source_type: 'fireflies'
    }
  };
}

async function checkExistingTranscript(firefliesId) {
  const { data, error } = await supabase
    .from('documents')
    .select('id')
    .eq('metadata->>fireflies_id', firefliesId)
    .limit(1);
  
  return data && data.length > 0;
}

async function syncFirefliesTranscripts() {
  console.log('🚀 Starting Fireflies Bulk Sync');
  console.log('='.repeat(50));
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🕐 Started at: ${new Date().toLocaleString()}`);
  console.log('='.repeat(50) + '\n');
  
  const stats = {
    total: 0,
    synced: 0,
    skipped: 0,
    failed: 0,
    errors: []
  };
  
  const batchSize = 50;
  let hasMore = true;
  let skip = 0;
  
  try {
    while (hasMore) {
      // Fetch batch from Fireflies
      const transcripts = await fetchFirefliesTranscripts(batchSize, skip);
      
      if (!transcripts || transcripts.length === 0) {
        console.log('✅ No more transcripts to sync');
        hasMore = false;
        break;
      }
      
      console.log(`\n📦 Processing batch of ${transcripts.length} transcripts...`);
      stats.total += transcripts.length;
      
      for (const transcript of transcripts) {
        try {
          // Check if already exists
          const exists = await checkExistingTranscript(transcript.id);
          
          if (exists) {
            console.log(`⏭️  Skipping existing: ${transcript.title} (${transcript.id})`);
            stats.skipped++;
            continue;
          }
          
          // Prepare document
          const document = await prepareTranscriptForStorage(transcript);
          
          // Insert into Supabase
          const { error: insertError } = await supabase
            .from('documents')
            .insert(document);
          
          if (insertError) {
            console.error(`❌ Failed to insert: ${transcript.title}`, insertError.message);
            stats.failed++;
            stats.errors.push({
              transcript: transcript.title,
              error: insertError.message
            });
          } else {
            console.log(`✅ Synced: ${transcript.title}`);
            stats.synced++;
          }
          
        } catch (error) {
          console.error(`❌ Error processing transcript ${transcript.id}:`, error.message);
          stats.failed++;
          stats.errors.push({
            transcript: transcript.title || transcript.id,
            error: error.message
          });
        }
      }
      
      // Check if we should continue
      if (transcripts.length < batchSize) {
        console.log('📊 Reached end of available transcripts');
        hasMore = false;
      } else {
        skip += batchSize;
        console.log(`\n⏩ Moving to next batch (skip: ${skip})...`);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
  } catch (error) {
    console.error('❌ Fatal error during sync:', error);
    stats.errors.push({ error: error.message });
  }
  
  // Print final summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(50));
  console.log(`📝 Total transcripts found: ${stats.total}`);
  console.log(`✅ Successfully synced: ${stats.synced}`);
  console.log(`⏭️  Skipped (already exist): ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log('='.repeat(50));
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    stats.errors.forEach((err, idx) => {
      console.log(`  ${idx + 1}. ${err.transcript || 'Unknown'}: ${err.error}`);
    });
  }
  
  console.log(`\n✨ Sync completed at: ${new Date().toLocaleString()}`);
  
  // Now trigger vectorization for the new documents
  if (stats.synced > 0) {
    console.log('\n🔄 Triggering vectorization for new documents...');
    await vectorizeNewDocuments();
  }
}

async function vectorizeNewDocuments() {
  console.log('🧮 Starting vectorization process...\n');
  
  // Get all documents without embeddings
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, content, title, metadata')
    .is('embedding', null)
    .eq('type', 'meeting_transcript')
    .limit(100);
  
  if (error) {
    console.error('❌ Error fetching documents for vectorization:', error);
    return;
  }
  
  if (!documents || documents.length === 0) {
    console.log('✅ All documents already vectorized!');
    return;
  }
  
  console.log(`📊 Found ${documents.length} documents to vectorize`);
  
  let vectorized = 0;
  let failed = 0;
  
  for (const doc of documents) {
    try {
      console.log(`🔄 Vectorizing: ${doc.title}`);
      
      // Call Supabase edge function to generate embedding
      const { data: embedding, error: embedError } = await supabase.functions.invoke(
        'generate-embedding',
        {
          body: { 
            text: doc.content.substring(0, 8000) // Limit to 8000 chars for embedding
          }
        }
      );
      
      if (embedError || !embedding?.embedding) {
        throw new Error(embedError?.message || 'No embedding returned');
      }
      
      // Update document with embedding
      const { error: updateError } = await supabase
        .from('documents')
        .update({ 
          embedding: embedding.embedding,
          updated_at: new Date().toISOString()
        })
        .eq('id', doc.id);
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      console.log(`  ✅ Vectorized successfully`);
      vectorized++;
      
    } catch (error) {
      console.error(`  ❌ Failed to vectorize: ${error.message}`);
      failed++;
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 VECTORIZATION SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully vectorized: ${vectorized} documents`);
  console.log(`❌ Failed: ${failed} documents`);
  console.log('='.repeat(50));
}

// Run the sync
syncFirefliesTranscripts().catch(console.error);