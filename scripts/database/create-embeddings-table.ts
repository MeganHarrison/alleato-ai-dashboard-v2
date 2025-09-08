/**
 * Create Embeddings Table Workaround
 * 
 * PURPOSE: Create a separate embeddings table as a workaround
 * USAGE: npx tsx scripts/create-embeddings-table.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createEmbeddingsTable() {
  console.log('📊 Creating fm_embeddings table as workaround...');
  
  // This table will store embeddings separately
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS fm_embeddings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      source_type VARCHAR(50) NOT NULL, -- 'figure' or 'table'
      source_id UUID NOT NULL,
      source_identifier VARCHAR(100), -- figure_number or table_number
      embedding vector(1536) NOT NULL,
      search_text TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_fm_embeddings_source 
    ON fm_embeddings (source_type, source_id);
    
    CREATE INDEX IF NOT EXISTS idx_fm_embeddings_vector 
    ON fm_embeddings 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);
    
    -- Grant permissions
    GRANT ALL ON fm_embeddings TO authenticated;
    GRANT ALL ON fm_embeddings TO service_role;
  `;
  
  console.log('⚠️  Please run the following SQL in your Supabase SQL Editor:');
  console.log(createTableSQL);
  
  // Try to check if table exists
  const { data, error } = await supabase
    .from('fm_embeddings')
    .select('count')
    .limit(1);
  
  if (error && error.code === '42P01') { // Table doesn't exist
    console.log('\n❌ Table fm_embeddings does not exist yet');
    console.log('   Please create it using the SQL above');
    return false;
  } else if (error) {
    console.log('\n⚠️  Could not verify table existence:', error.message);
    return false;
  } else {
    console.log('\n✅ Table fm_embeddings exists!');
    return true;
  }
}

async function main() {
  console.log('🚀 Starting embeddings table creation...');
  
  const exists = await createEmbeddingsTable();
  
  if (exists) {
    console.log('\n✅ Ready to store embeddings!');
    console.log('   Next: Run the modified embedding generation script');
  } else {
    console.log('\n📝 Next steps:');
    console.log('   1. Copy the SQL above');
    console.log('   2. Go to your Supabase dashboard');
    console.log('   3. Open SQL Editor');
    console.log('   4. Run the SQL');
    console.log('   5. Come back and run: npm run generate:fm-embeddings');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export default createEmbeddingsTable;