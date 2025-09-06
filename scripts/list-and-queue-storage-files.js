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

async function listAndQueueStorageFiles() {
  console.log('🔍 Checking meetings storage bucket and queuing for vectorization...\n')

  try {
    // 1. List all files in the meetings storage bucket
    console.log('📁 Listing files in meetings storage bucket...')
    
    const { data: files, error: listError } = await supabase
      .storage
      .from('meetings')
      .list('', {
        limit: 1000,
        offset: 0
      })

    if (listError) {
      console.error('❌ Error listing files:', listError)
      return
    }

    console.log(`✅ Found ${files?.length || 0} files in storage bucket!\n`)

    if (!files || files.length === 0) {
      console.log('⚠️  No files found in storage bucket')
      console.log('   Make sure files are uploaded to the "meetings" bucket')
      return
    }

    // Show first 10 files
    console.log('📋 Sample files:')
    files.slice(0, 10).forEach(file => {
      const sizeKB = file.metadata?.size ? (file.metadata.size / 1024).toFixed(2) : 'unknown'
      console.log(`   - ${file.name} (${sizeKB} KB)`)
    })
    
    if (files.length > 10) {
      console.log(`   ... and ${files.length - 10} more files\n`)
    }

    // 2. Check what's already in the vectorization queue
    console.log('📊 Checking existing queue...')
    
    const { data: existingQueue, error: queueCheckError } = await supabase
      .from('meeting_vectorization_queue')
      .select('storage_path, status')

    const existingPaths = new Set(existingQueue?.map(q => q.storage_path) || [])
    const filesToQueue = files.filter(f => !existingPaths.has(f.name))

    console.log(`   Already in queue: ${existingPaths.size}`)
    console.log(`   New files to add: ${filesToQueue.length}\n`)

    // 3. Add new files to vectorization queue
    if (filesToQueue.length > 0) {
      console.log('📝 Adding new files to vectorization queue...')
      
      const BATCH_SIZE = 50
      let totalQueued = 0
      
      for (let i = 0; i < filesToQueue.length; i += BATCH_SIZE) {
        const batch = filesToQueue.slice(i, Math.min(i + BATCH_SIZE, filesToQueue.length))
        
        const queueItems = batch.map(file => ({
          storage_path: file.name,
          status: 'pending',
          fireflies_metadata: {
            filename: file.name,
            size: file.metadata?.size,
            created_at: file.created_at,
            updated_at: file.updated_at
          }
        }))

        const { error: insertError } = await supabase
          .from('meeting_vectorization_queue')
          .insert(queueItems)

        if (insertError) {
          console.log(`   ⚠️  Batch ${Math.floor(i/BATCH_SIZE) + 1} error:`, insertError.message)
        } else {
          totalQueued += batch.length
          console.log(`   ✅ Queued batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} files`)
        }
      }
      
      console.log(`\n✅ Successfully queued ${totalQueued} files for vectorization!`)
    }

    // 4. Show queue status
    console.log('\n📈 Current Queue Status:')
    
    const { data: queueStatus, error: statusError } = await supabase
      .from('meeting_vectorization_queue')
      .select('status')

    if (!statusError && queueStatus) {
      const statusCounts = {}
      queueStatus.forEach(item => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
      })

      Object.entries(statusCounts).forEach(([status, count]) => {
        const icon = status === 'completed' ? '✅' : 
                     status === 'processing' ? '🔄' : 
                     status === 'failed' ? '❌' : '⏳'
        console.log(`   ${icon} ${status}: ${count}`)
      })
    }

    // 5. Instructions to trigger processing
    console.log('\n🚀 Ready to vectorize!')
    console.log('=' + '='.repeat(50))
    console.log('To process these files:')
    console.log('\n1. Make sure dev server is running:')
    console.log('   npm run dev')
    console.log('\n2. Login and visit:')
    console.log('   http://localhost:3010/api/cron/vectorize-meetings')
    console.log('\n3. Or use the trigger page:')
    console.log('   http://localhost:3010/trigger-vectorization')
    console.log('\nThe system will process files in batches and create vector embeddings.')
    console.log(`Total files ready: ${files.length}`)

  } catch (error) {
    console.error('❌ Fatal error:', error)
  }
}

// Run the script
listAndQueueStorageFiles()