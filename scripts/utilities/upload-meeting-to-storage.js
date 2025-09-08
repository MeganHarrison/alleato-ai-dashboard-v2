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

async function uploadMeetingsToStorage() {
  console.log('📤 Uploading meetings to storage bucket for vectorization...\n')

  try {
    // 1. Get meetings with summaries from database
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('id, title, summary, date, fireflies_id, participants, tags')
      .not('summary', 'is', null)
      .order('date', { ascending: false })
      .limit(10) // Start with 10 meetings as a test

    if (error) throw error

    console.log(`📊 Found ${meetings.length} meetings with summaries to upload\n`)

    let uploaded = 0
    let failed = 0

    for (const meeting of meetings) {
      try {
        // Create a markdown file content from meeting data
        const transcriptContent = `# ${meeting.title}

**Date:** ${meeting.date}
**Meeting ID:** ${meeting.fireflies_id || meeting.id}
**Participants:** ${Array.isArray(meeting.participants) ? meeting.participants.join(', ') : 'Unknown'}
**Tags:** ${Array.isArray(meeting.tags) ? meeting.tags.join(', ') : 'None'}

## Summary

${meeting.summary || 'No summary available'}

---
*This transcript was auto-generated for vectorization testing*
`

        // Create filename
        const fileName = `${meeting.fireflies_id || meeting.id}_${meeting.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.md`

        // Upload to storage
        const { data, error: uploadError } = await supabase
          .storage
          .from('meetings')
          .upload(fileName, new Blob([transcriptContent], { type: 'text/markdown' }), {
            upsert: true // Overwrite if exists
          })

        if (uploadError) {
          console.log(`   ❌ Failed to upload: ${meeting.title}`)
          console.log(`      Error: ${uploadError.message}`)
          failed++
        } else {
          console.log(`   ✅ Uploaded: ${meeting.title}`)
          console.log(`      File: ${fileName}`)
          uploaded++
        }
      } catch (err) {
        console.log(`   ❌ Error processing: ${meeting.title}`)
        console.log(`      ${err.message}`)
        failed++
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 UPLOAD COMPLETE')
    console.log('='.repeat(50))
    console.log(`✅ Successfully uploaded: ${uploaded}`)
    console.log(`❌ Failed: ${failed}`)

    if (uploaded > 0) {
      console.log('\n🎯 Next Steps:')
      console.log('1. Visit http://localhost:3010/trigger-vectorization')
      console.log('2. Click "Trigger Vectorization" button')
      console.log('3. The system will process these files and create embeddings')
      console.log('\nOr directly visit: http://localhost:3010/api/cron/vectorize-meetings')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the upload
uploadMeetingsToStorage()