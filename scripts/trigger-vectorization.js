import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function triggerVectorization() {
  console.log('🚀 Triggering Vectorization for Existing Meetings...\n')
  
  try {
    // 1. Get all meetings
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching meetings:', error)
      return
    }

    console.log(`📊 Found ${meetings.length} meetings in database`)
    
    // Count vectorized vs not vectorized (using processed_at since vectorized_at doesn't exist)
    const vectorized = meetings.filter(m => m.processed_at).length
    const needsProcessing = meetings.filter(m => !m.processed_at).length
    
    console.log(`✅ Already vectorized: ${vectorized}`)
    console.log(`⏳ Needs vectorization: ${needsProcessing}`)
    
    // 2. Check storage bucket for transcript files
    console.log('\n📁 Checking storage bucket...')
    const { data: files, error: storageError } = await supabase
      .storage
      .from('meetings')
      .list()

    if (storageError) {
      console.log('⚠️  Storage bucket issue:', storageError.message)
    } else {
      console.log(`📄 Files in storage: ${files?.length || 0}`)
      
      // Add files to vectorization queue
      if (files && files.length > 0) {
        console.log('\n📝 Adding files to vectorization queue...')
        
        for (const file of files.slice(0, 10)) { // Process first 10 for testing
          const { error: queueError } = await supabase
            .from('meeting_vectorization_queue')
            .upsert({
              storage_path: file.name,
              status: 'pending',
              fireflies_metadata: {
                title: file.name,
                date: file.created_at
              }
            }, { 
              onConflict: 'storage_path',
              ignoreDuplicates: true 
            })
            
          if (!queueError) {
            console.log(`   ✅ Queued: ${file.name}`)
          }
        }
      }
    }
    
    // 3. Process meetings that have transcripts but aren't vectorized
    const meetingsWithTranscripts = meetings.filter(m => 
      (m.transcript_url || m.storage_bucket_path) && !m.processed_at
    )
    
    if (meetingsWithTranscripts.length > 0) {
      console.log(`\n🔍 Found ${meetingsWithTranscripts.length} meetings with transcripts to vectorize`)
      
      // For now, just show what we found
      meetingsWithTranscripts.slice(0, 5).forEach(m => {
        console.log(`   - ${m.title} (${m.fireflies_id})`)
      })
      
      if (meetingsWithTranscripts.length > 5) {
        console.log(`   ... and ${meetingsWithTranscripts.length - 5} more`)
      }
    }
    
    // 4. Check vectorization queue status
    console.log('\n📈 Checking vectorization queue...')
    const { data: queueItems, error: queueError } = await supabase
      .from('meeting_vectorization_queue')
      .select('status')
    
    if (!queueError && queueItems) {
      const statusCounts = {}
      queueItems.forEach(item => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
      })
      
      console.log('Queue Status:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`)
      })
    }
    
    // 5. Trigger the API endpoint
    console.log('\n🔄 Attempting to trigger vectorization API...')
    
    const apiUrl = 'http://localhost:3010'
    try {
      // Start dev server if not running
      console.log('   Ensuring dev server is running...')
      
      const response = await fetch(`${apiUrl}/api/cron/vectorize-meetings`, {
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        }
      }).catch(() => null)
      
      if (response && response.ok) {
        const data = await response.text()
        console.log('✅ API triggered successfully!')
        console.log('   Response:', data.substring(0, 100))
      } else {
        console.log('⚠️  Could not trigger API automatically')
        console.log(`   Manual trigger: Visit ${apiUrl}/api/cron/vectorize-meetings while logged in`)
      }
    } catch (error) {
      console.log('⚠️  API not accessible:', error.message)
    }
    
    console.log('\n✨ Done! Next steps:')
    console.log('1. Start dev server: npm run dev')
    console.log('2. Login at http://localhost:3010')
    console.log('3. Visit http://localhost:3010/api/cron/vectorize-meetings')
    console.log('4. Or go to /meeting-intelligence and use the Upload tab')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

triggerVectorization()