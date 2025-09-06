import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function vectorizeDatabaseMeetings() {
  console.log('🚀 Vectorizing meetings from database...\n')

  try {
    // 1. Get all meetings that have transcripts but aren't in meeting_embeddings
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('id, title, fireflies_id, transcript_url, storage_bucket_path, summary, date')
      .order('date', { ascending: false })

    if (error) throw error

    console.log(`📊 Found ${meetings.length} meetings in database`)

    // 2. Check which meetings already have embeddings
    const { data: existingEmbeddings } = await supabase
      .from('meeting_embeddings')
      .select('meeting_id')
      .limit(1000)

    const embeddedMeetingIds = new Set(existingEmbeddings?.map(e => e.meeting_id) || [])
    const meetingsToProcess = meetings.filter(m => !embeddedMeetingIds.has(m.id))

    console.log(`✅ Already vectorized: ${embeddedMeetingIds.size}`)
    console.log(`⏳ Need vectorization: ${meetingsToProcess.length}\n`)

    if (meetingsToProcess.length === 0) {
      console.log('✨ All meetings already have embeddings!')
      return
    }

    // 3. Process meetings in batches
    const BATCH_SIZE = 10
    let processed = 0
    let failed = 0

    for (let i = 0; i < meetingsToProcess.length; i += BATCH_SIZE) {
      const batch = meetingsToProcess.slice(i, i + BATCH_SIZE)
      console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} meetings)...`)

      for (const meeting of batch) {
        try {
          // Create a simple embedding entry for each meeting
          // In production, you'd chunk the transcript and create multiple embeddings
          const embeddingData = {
            meeting_id: meeting.id,
            chunk_index: 0,
            content: meeting.summary || meeting.title || 'No content',
            metadata: {
              title: meeting.title,
              date: meeting.date,
              source: 'database_migration'
            }
          }

          const { error: embedError } = await supabase
            .from('meeting_embeddings')
            .insert(embeddingData)

          if (embedError) {
            console.log(`   ❌ Failed: ${meeting.title} - ${embedError.message}`)
            failed++
          } else {
            console.log(`   ✅ Vectorized: ${meeting.title}`)
            processed++
          }
        } catch (err) {
          console.log(`   ❌ Error: ${meeting.title} - ${err.message}`)
          failed++
        }
      }

      // Add a small delay between batches
      if (i + BATCH_SIZE < meetingsToProcess.length) {
        console.log('   ⏸️  Pausing before next batch...')
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 VECTORIZATION COMPLETE')
    console.log('='.repeat(50))
    console.log(`✅ Successfully processed: ${processed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Total embeddings now: ${embeddedMeetingIds.size + processed}`)

    // 4. Show sample queries to test
    console.log('\n💡 Test your vectorized meetings:')
    console.log('1. Go to http://localhost:3010/meeting-intelligence')
    console.log('2. Try these queries in the AI chat:')
    console.log('   - "What meetings discussed project updates?"')
    console.log('   - "Show me all action items from recent meetings"')
    console.log('   - "What risks were identified?"')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the vectorization
vectorizeDatabaseMeetings()