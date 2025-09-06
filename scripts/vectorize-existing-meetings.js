import { createClient } from '@supabase/supabase-js'
import { MeetingVectorizationService } from '../lib/services/meeting-vectorization.js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function vectorizeExistingMeetings() {
  console.log('🚀 Starting Meeting Vectorization Process...\n')
  
  try {
    // 1. Check how many meetings we have
    const { data: meetings, error: meetingsError } = await supabase
      .from('meetings')
      .select('id, title, fireflies_id, vectorized_at')
      .order('meeting_date', { ascending: false })

    if (meetingsError) {
      console.error('❌ Error fetching meetings:', meetingsError)
      return
    }

    console.log(`📊 Found ${meetings.length} total meetings in database`)
    
    // Check how many are already vectorized
    const vectorized = meetings.filter(m => m.vectorized_at)
    const notVectorized = meetings.filter(m => !m.vectorized_at)
    
    console.log(`✅ Already vectorized: ${vectorized.length}`)
    console.log(`⏳ Need vectorization: ${notVectorized.length}\n`)

    if (notVectorized.length === 0) {
      console.log('✨ All meetings are already vectorized!')
      return
    }

    // 2. Check for files in storage bucket
    const { data: storageFiles, error: storageError } = await supabase
      .storage
      .from('meetings')
      .list()

    if (storageError) {
      console.log('⚠️  Could not list storage files:', storageError.message)
      console.log('    Storage bucket might not exist or be empty')
    } else {
      console.log(`📁 Found ${storageFiles?.length || 0} files in storage bucket\n`)
    }

    // 3. Add meetings to vectorization queue
    console.log('📝 Adding meetings to vectorization queue...')
    
    let addedToQueue = 0
    let errors = 0

    for (const meeting of notVectorized) {
      // Check if meeting has a storage path or transcript
      if (meeting.storage_path || meeting.raw_transcript) {
        const { error } = await supabase
          .from('meeting_vectorization_queue')
          .upsert({
            storage_path: meeting.storage_path || `meeting_${meeting.id}`,
            status: 'pending',
            fireflies_metadata: {
              fireflies_id: meeting.fireflies_id,
              title: meeting.title
            }
          }, { onConflict: 'storage_path' })

        if (error) {
          console.log(`   ❌ Error adding ${meeting.title}: ${error.message}`)
          errors++
        } else {
          console.log(`   ✅ Added: ${meeting.title}`)
          addedToQueue++
        }
      }
    }

    console.log(`\n📊 Queue Status:`)
    console.log(`   ✅ Added to queue: ${addedToQueue}`)
    console.log(`   ❌ Errors: ${errors}`)

    // 4. Trigger the vectorization process
    if (addedToQueue > 0) {
      console.log('\n🔄 Triggering vectorization process...')
      
      // Call the API endpoint to process the queue
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'
      
      try {
        const response = await fetch(`${apiUrl}/api/cron/vectorize-meetings`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          }
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('✅ Vectorization triggered successfully!')
          console.log('   Response:', result)
        } else {
          console.log('⚠️  API call returned status:', response.status)
          console.log('   You may need to trigger manually via the UI')
        }
      } catch (fetchError) {
        console.log('⚠️  Could not call API:', fetchError.message)
        console.log('   The queue is ready, but you\'ll need to trigger processing manually')
      }
    }

    // 5. Monitor progress
    console.log('\n📈 Monitoring vectorization progress...')
    
    // Check queue status
    const { data: queueStatus, error: queueError } = await supabase
      .from('meeting_vectorization_queue')
      .select('status')

    if (!queueError && queueStatus) {
      const statusCounts = queueStatus.reduce((acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      }, {})

      console.log('\n📊 Current Queue Status:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        const icon = status === 'completed' ? '✅' : 
                     status === 'processing' ? '🔄' : 
                     status === 'failed' ? '❌' : '⏳'
        console.log(`   ${icon} ${status}: ${count}`)
      })
    }

    console.log('\n✨ Vectorization process initiated!')
    console.log('   - Check back in a few minutes to see progress')
    console.log('   - Visit /meeting-intelligence to use the AI chat')
    console.log('   - The system will process meetings in the background')

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the script
vectorizeExistingMeetings()