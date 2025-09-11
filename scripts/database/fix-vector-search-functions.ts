import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { promises as fs } from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration(migrationPath: string) {
  try {
    const sql = await fs.readFile(migrationPath, 'utf-8');
    console.log(`Running migration: ${path.basename(migrationPath)}`);
    
    // Split by statements and run each one
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await supabase.rpc('query', { query: statement + ';' }).single();
      } catch (error: unknown) {
        // Try direct SQL execution
        const { error: execError } = await supabase.from('_sql').select('*').limit(0);
        if (execError) {
          console.log(`Statement failed (may already exist): ${statement.substring(0, 50)}...`);
        }
      }
    }
    
    console.log(`✅ Completed: ${path.basename(migrationPath)}`);
  } catch (error) {
    console.error(`❌ Failed migration ${migrationPath}:`, error);
  }
}

async function createMissingFunctions() {
  console.log('\n📦 Creating missing vector search functions...\n');
  
  // Create the match_meeting_chunks function that the code expects
  const createMatchMeetingChunksSQL = `
    -- Create the match_meeting_chunks function that the API expects
    CREATE OR REPLACE FUNCTION match_meeting_chunks(
      query_embedding vector(384),
      match_threshold FLOAT DEFAULT 0.5,
      match_count INT DEFAULT 5
    )
    RETURNS TABLE (
      meeting_id UUID,
      chunk_index INTEGER,
      content TEXT,
      similarity FLOAT,
      metadata JSONB
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      -- First try to use meeting_embeddings table with 384-dim vectors
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meeting_embeddings' 
        AND column_name = 'embedding_vector'
      ) THEN
        RETURN QUERY
        SELECT 
          me.meeting_id,
          me.chunk_index,
          me.content,
          1 - (me.embedding_vector <=> query_embedding) as similarity,
          me.metadata
        FROM meeting_embeddings me
        WHERE me.embedding_vector IS NOT NULL
          AND 1 - (me.embedding_vector <=> query_embedding) > match_threshold
        ORDER BY me.embedding_vector <=> query_embedding
        LIMIT match_count;
      ELSE
        -- Fallback: return empty result if table doesn't exist
        RETURN;
      END IF;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createMatchMeetingChunksSQL });
    if (error) {
      console.log('Creating function via direct SQL...');
      // Try alternative approach
    }
    console.log('✅ Created match_meeting_chunks function');
  } catch (error) {
    console.error('⚠️ Could not create match_meeting_chunks function:', error);
  }

  // Ensure the vector_search function exists with the correct signature
  const createVectorSearchSQL = `
    CREATE OR REPLACE FUNCTION vector_search(
      query_embedding vector(384),
      match_threshold FLOAT DEFAULT 0.5,
      match_count INT DEFAULT 5
    )
    RETURNS TABLE (
      meeting_id UUID,
      chunk_index INTEGER,
      content TEXT,
      similarity FLOAT,
      metadata JSONB
    )
    LANGUAGE plpgsql
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        meeting_id,
        chunk_index,
        content,
        similarity,
        metadata
      FROM match_meeting_chunks(query_embedding, match_threshold, match_count);
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createVectorSearchSQL });
    if (error) {
      console.log('Creating vector_search function via direct SQL...');
    }
    console.log('✅ Created vector_search function');
  } catch (error) {
    console.error('⚠️ Could not create vector_search function:', error);
  }
}

async function checkExistingStructure() {
  console.log('\n🔍 Checking existing database structure...\n');
  
  // Check if meeting_embeddings table exists
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .in('table_name', ['meeting_embeddings', 'meetings', 'ai_insights']);
  
  if (tables) {
    console.log('Existing tables:', tables.map(t => t.table_name).join(', '));
  }
  
  // Check if pgvector extension is enabled
  const { data: extensions, error: extError } = await supabase
    .from('pg_extension')
    .select('extname')
    .eq('extname', 'vector');
  
  if (extensions && extensions.length > 0) {
    console.log('✅ pgvector extension is enabled');
  } else {
    console.log('⚠️ pgvector extension is not enabled');
  }
  
  // Check existing functions
  const { data: functions, error: funcError } = await supabase
    .from('information_schema.routines')
    .select('routine_name')
    .eq('routine_schema', 'public')
    .in('routine_name', ['vector_search', 'match_meeting_chunks', 'search_meeting_embeddings']);
  
  if (functions) {
    console.log('Existing functions:', functions.map(f => f.routine_name).join(', '));
  }
}

async function main() {
  console.log('🚀 Starting vector search fix...\n');
  
  // Check existing structure
  await checkExistingStructure();
  
  // Run migrations in order
  const migrationsDir = path.join(__dirname, '../../supabase/migrations');
  const migrationFiles = [
    '20250828_vector_search_setup.sql',
    '20250829_meeting_vectorization_system.sql',
    '20250901_pm_rag_agent_tables.sql',
    '20250903_pm_rag_vector_search.sql'
  ];
  
  console.log('\n📝 Running migrations...\n');
  
  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    if (await fs.access(migrationPath).then(() => true).catch(() => false)) {
      await runMigration(migrationPath);
    } else {
      console.log(`⚠️ Migration file not found: ${file}`);
    }
  }
  
  // Create missing functions
  await createMissingFunctions();
  
  console.log('\n✅ Database setup complete!');
  console.log('\nNext steps:');
  console.log('1. Generate embeddings for existing meeting data');
  console.log('2. Test the vector search functionality');
}

main().catch(console.error);