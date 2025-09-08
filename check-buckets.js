const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkBuckets() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    console.log('📁 Checking all storage buckets...\n');

    const { data: bucketsData, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to list buckets: ${listError.message}`);
    }

    console.log(`Found ${bucketsData.length} buckets:`);
    bucketsData.forEach(bucket => {
      console.log(`  - ${bucket.name} (ID: ${bucket.id}, Public: ${bucket.public})`);
    });

    // Try to list files in rag_documents bucket specifically
    console.log('\n🔍 Testing rag_documents bucket access...');
    const { data: filesData, error: filesError } = await supabase.storage
      .from('rag_documents')
      .list('', { limit: 1 });

    if (filesError) {
      console.log('❌ Error accessing rag_documents bucket:', filesError.message);
    } else {
      console.log('✅ rag_documents bucket is accessible');
      console.log(`   Contains ${filesData.length} items`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkBuckets();