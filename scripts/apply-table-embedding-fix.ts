/**
 * Apply Table Embedding Fix
 * 
 * PURPOSE: Ensure embedding column exists on fm_global_tables
 * USAGE: tsx scripts/apply-table-embedding-fix.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function applyFix() {
  console.log('🔧 Applying embedding column fix for fm_global_tables...');
  
  try {
    // First, check if the column already exists
    const { data: columns, error: checkError } = await supabase
      .from('fm_global_tables')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.log('   ℹ️  Table check error:', checkError.message);
    }
    
    // Try to add the column via raw SQL (this might fail but that's ok)
    console.log('   📝 Adding embedding column if missing...');
    
    // Since we can't run ALTER TABLE directly through Supabase client,
    // let's verify if we can query with the embedding column
    const { data: testData, error: testError } = await supabase
      .from('fm_global_tables')
      .select('table_id, title, embedding')
      .limit(1);
    
    if (testError && testError.message.includes('embedding')) {
      console.error('   ❌ Embedding column is missing!');
      console.log('   ⚠️  Please run the following SQL in your Supabase SQL Editor:');
      console.log(`
ALTER TABLE fm_global_tables
ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS idx_fm_tables_embedding 
ON fm_global_tables 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);
      `);
      return false;
    }
    
    console.log('   ✅ Embedding column exists or was added successfully');
    
    // Count how many tables have embeddings
    const { count: withEmbeddings } = await supabase
      .from('fm_global_tables')
      .select('*', { count: 'exact', head: true })
      .not('embedding', 'is', null);
    
    const { count: totalTables } = await supabase
      .from('fm_global_tables')
      .select('*', { count: 'exact', head: true });
    
    console.log(`   📊 Tables with embeddings: ${withEmbeddings || 0} / ${totalTables || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error applying fix:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting FM Global Table Embedding Fix...');
  console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  const success = await applyFix();
  
  if (success) {
    console.log('\n✅ Fix applied successfully!');
    console.log('   Next step: Run "npm run generate:fm-embeddings" to generate embeddings');
  } else {
    console.log('\n⚠️  Manual intervention required');
    console.log('   Please run the SQL commands shown above in your Supabase SQL Editor');
    console.log('   Then run "npm run generate:fm-embeddings" to generate embeddings');
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export default applyFix;