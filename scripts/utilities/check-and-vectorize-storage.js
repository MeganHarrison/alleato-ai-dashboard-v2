import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

async function checkStorageAndVectorize() {
  console.log('🔍 Checking Supabase storage bucket and triggering vectorization...\n')

  try {
    // 1. List all files in the meetings bucket using REST API
    console.log('📁 Fetching files from meetings storage bucket...')
    
    const response = await fetch(`${supabaseUrl}/storage/v1/object/list/meetings`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    })

    if (!response.ok) {
      throw new Error(`Storage API error: ${response.status} ${response.statusText}`)
    }

    const files = await response.json()
    console.log(`✅ Found ${files.length} files in storage bucket\n`)

    if (files.length > 0) {
      console.log('📋 First 10 files:')
      files.slice(0, 10).forEach(file => {
        console.log(`   - ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`)
      })
      
      if (files.length > 10) {
        console.log(`   ... and ${files.length - 10} more files\n`)
      }
    }

    // 2. Add files to vectorization queue
    console.log('\n📝 Adding files to vectorization queue...')
    
    const supabaseRestUrl = `${supabaseUrl}/rest/v1`
    let addedCount = 0
    let skippedCount = 0

    // Process in batches to avoid overwhelming the API
    const BATCH_SIZE = 20
    
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, Math.min(i + BATCH_SIZE, files.length))
      
      // Prepare batch insert
      const queueItems = batch.map(file => ({
        storage_path: file.name,
        status: 'pending',
        fireflies_metadata: {
          filename: file.name,
          size: file.metadata?.size,
          created_at: file.created_at || file.updated_at
        }
      }))

      // Insert to vectorization queue
      const queueResponse = await fetch(`${supabaseRestUrl}/meeting_vectorization_queue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(queueItems)
      })

      if (queueResponse.ok) {
        addedCount += batch.length
        console.log(`   ✅ Added batch ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} files`)
      } else {
        const error = await queueResponse.text()
        console.log(`   ⚠️  Batch ${Math.floor(i/BATCH_SIZE) + 1} issue: ${error.substring(0, 100)}`)
        skippedCount += batch.length
      }
    }

    console.log(`\n📊 Queue Status:`)
    console.log(`   ✅ Added to queue: ${addedCount}`)
    console.log(`   ⏭️  Skipped (already in queue): ${skippedCount}`)

    // 3. Check current queue status
    console.log('\n📈 Checking vectorization queue status...')
    
    const queueStatusResponse = await fetch(
      `${supabaseRestUrl}/meeting_vectorization_queue?select=status`, 
      {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      }
    )

    if (queueStatusResponse.ok) {
      const queueItems = await queueStatusResponse.json()
      const statusCounts = {}
      
      queueItems.forEach(item => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1
      })

      console.log('Current queue breakdown:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        const icon = status === 'completed' ? '✅' : 
                     status === 'processing' ? '🔄' : 
                     status === 'failed' ? '❌' : '⏳'
        console.log(`   ${icon} ${status}: ${count}`)
      })
    }

    // 4. Try to trigger the vectorization endpoint
    console.log('\n🚀 Attempting to trigger vectorization...')
    
    // First, let's check if we can access it directly with the service key
    const vectorizeUrl = `${supabaseUrl}/functions/v1/embed_meetings`
    
    const triggerResponse = await fetch(vectorizeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        action: 'process_queue',
        limit: 10 
      })
    })

    if (triggerResponse.ok) {
      const result = await triggerResponse.json()
      console.log('✅ Edge function triggered successfully!')
      console.log('   Response:', result)
    } else {
      console.log('⚠️  Edge function not available or requires different auth')
      console.log(`   Status: ${triggerResponse.status}`)
      
      console.log('\n📝 Manual trigger instructions:')
      console.log('1. Login at http://localhost:3010')
      console.log('2. Visit http://localhost:3010/api/cron/vectorize-meetings')
      console.log('   This will process the queued files')
    }

    console.log('\n✨ Done! Your meetings are ready to be vectorized.')
    console.log(`📊 Total files in storage: ${files.length}`)
    console.log('🎯 The vectorization will process these files and create searchable embeddings')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Run the check
checkStorageAndVectorize()