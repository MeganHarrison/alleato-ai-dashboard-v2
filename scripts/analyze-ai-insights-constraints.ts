import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeConstraints() {
  console.log('🔍 Analyzing AI Insights Table Constraints...\n');

  try {
    // 1. Get foreign key constraints on ai_insights
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_table_constraints', { table_name: 'ai_insights' });

    if (constraintsError) {
      // Try alternative query using information_schema
      const { data: fkConstraints, error: fkError } = await supabase
        .from('information_schema.table_constraints')
        .select('*')
        .eq('table_name', 'ai_insights')
        .eq('constraint_type', 'FOREIGN KEY');

      if (fkError) {
        console.log('Using direct SQL query for constraints...');
        
        // Use direct SQL query
        const { data: sqlConstraints, error: sqlError } = await supabase.rpc('query_constraints');
        
        if (sqlError) {
          console.error('Error fetching constraints:', sqlError);
        } else {
          console.log('Constraints found:', sqlConstraints);
        }
      } else {
        console.log('Foreign Key Constraints:', fkConstraints);
      }
    } else {
      console.log('Table Constraints:', constraints);
    }

    // 2. Check table structure
    console.log('\n📊 Analyzing Table Structures...\n');

    // Get ai_insights columns
    const { data: aiInsightsColumns, error: aiError } = await supabase
      .from('ai_insights')
      .select('*')
      .limit(0);

    if (!aiError) {
      console.log('AI Insights table exists');
    }

    // Get meetings columns
    const { data: meetingsColumns, error: meetingsError } = await supabase
      .from('meetings')
      .select('*')
      .limit(0);

    if (!meetingsError) {
      console.log('Meetings table exists');
    } else {
      console.log('Meetings table error:', meetingsError.message);
    }

    // Get documents columns
    const { data: documentsColumns, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .limit(0);

    if (!documentsError) {
      console.log('Documents table exists');
    } else {
      console.log('Documents table error:', documentsError.message);
    }

    // 3. Check existing data relationships
    console.log('\n🔗 Checking Existing Relationships...\n');

    // Check if ai_insights has meeting_id column
    const { data: sampleInsight, error: sampleError } = await supabase
      .from('ai_insights')
      .select('id, meeting_id, created_at')
      .limit(1);

    if (!sampleError && sampleInsight) {
      console.log('Sample ai_insights record:', sampleInsight);
    }

    // Count insights with meeting_id
    const { count: meetingInsightsCount, error: countError } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact', head: true })
      .not('meeting_id', 'is', null);

    if (!countError) {
      console.log(`Insights with meeting_id: ${meetingInsightsCount}`);
    }

  } catch (error) {
    console.error('Error in analysis:', error);
  }
}

// Create RPC function to query constraints
async function createConstraintQueryFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION query_constraints()
    RETURNS TABLE (
      constraint_name text,
      constraint_type text,
      table_name text,
      column_name text,
      foreign_table_name text,
      foreign_column_name text
    )
    LANGUAGE sql
    SECURITY DEFINER
    AS $$
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE 
        tc.table_name = 'ai_insights'
        AND tc.table_schema = 'public'
      ORDER BY 
        tc.constraint_type, tc.constraint_name;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (error) {
      console.log('Note: Could not create helper function (might already exist)');
    }
  } catch (e) {
    // Function might already exist
  }
}

async function getDetailedConstraints() {
  console.log('\n📋 Getting Detailed Constraint Information...\n');

  const constraintSQL = `
    SELECT 
      tc.constraint_name,
      tc.constraint_type,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      rc.update_rule,
      rc.delete_rule
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      LEFT JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
        AND rc.constraint_schema = tc.table_schema
    WHERE 
      tc.table_name = 'ai_insights'
      AND tc.table_schema = 'public'
    ORDER BY 
      tc.constraint_type, tc.constraint_name;
  `;

  console.log('Constraint Query SQL:', constraintSQL);
}

async function proposeFixSolutions() {
  console.log('\n💡 Proposed Solutions:\n');

  console.log('APPROACH 1: Add document_id column and migrate data');
  console.log(`
-- Step 1: Add document_id column
ALTER TABLE ai_insights ADD COLUMN document_id UUID;

-- Step 2: Add foreign key constraint to documents
ALTER TABLE ai_insights 
ADD CONSTRAINT ai_insights_document_id_fkey 
FOREIGN KEY (document_id) 
REFERENCES documents(id) 
ON DELETE CASCADE;

-- Step 3: Migrate existing data (if meetings are linked to documents)
UPDATE ai_insights ai
SET document_id = m.document_id
FROM meetings m
WHERE ai.meeting_id = m.id;

-- Step 4: Drop the old constraint (after verification)
ALTER TABLE ai_insights 
DROP CONSTRAINT ai_insights_meeting_id_fkey;

-- Step 5: Optionally drop meeting_id column
ALTER TABLE ai_insights DROP COLUMN meeting_id;
  `);

  console.log('\nAPPROACH 2: Keep both relationships (flexible approach)');
  console.log(`
-- Step 1: Make meeting_id nullable
ALTER TABLE ai_insights 
ALTER COLUMN meeting_id DROP NOT NULL;

-- Step 2: Add document_id column
ALTER TABLE ai_insights ADD COLUMN document_id UUID;

-- Step 3: Add foreign key constraint to documents
ALTER TABLE ai_insights 
ADD CONSTRAINT ai_insights_document_id_fkey 
FOREIGN KEY (document_id) 
REFERENCES documents(id) 
ON DELETE CASCADE;

-- Step 4: Add check constraint to ensure one relationship exists
ALTER TABLE ai_insights 
ADD CONSTRAINT ai_insights_has_parent_check 
CHECK (
  (meeting_id IS NOT NULL AND document_id IS NULL) OR 
  (meeting_id IS NULL AND document_id IS NOT NULL)
);
  `);

  console.log('\nAPPROACH 3: Create a polymorphic relationship');
  console.log(`
-- Step 1: Add parent_type and parent_id columns
ALTER TABLE ai_insights 
ADD COLUMN parent_type TEXT CHECK (parent_type IN ('meeting', 'document')),
ADD COLUMN parent_id UUID;

-- Step 2: Migrate existing data
UPDATE ai_insights 
SET parent_type = 'meeting', parent_id = meeting_id
WHERE meeting_id IS NOT NULL;

-- Step 3: Drop old foreign key and column
ALTER TABLE ai_insights 
DROP CONSTRAINT ai_insights_meeting_id_fkey,
DROP COLUMN meeting_id;

-- Step 4: Create indexes for performance
CREATE INDEX idx_ai_insights_parent ON ai_insights(parent_type, parent_id);
  `);

  console.log('\n⚠️ Implications of Each Approach:\n');
  console.log('1. APPROACH 1 (Document-only):');
  console.log('   - Pros: Clean, single relationship, better performance');
  console.log('   - Cons: Loses meeting relationship, requires data migration');
  console.log('   - Best for: When meetings are no longer needed\n');

  console.log('2. APPROACH 2 (Dual relationship):');
  console.log('   - Pros: Flexible, preserves existing data, gradual migration');
  console.log('   - Cons: More complex queries, potential confusion');
  console.log('   - Best for: Transitional period or mixed use cases\n');

  console.log('3. APPROACH 3 (Polymorphic):');
  console.log('   - Pros: Very flexible, supports multiple parent types');
  console.log('   - Cons: No foreign key enforcement, requires application-level validation');
  console.log('   - Best for: When insights can belong to various entity types');
}

async function main() {
  await createConstraintQueryFunction();
  await analyzeConstraints();
  await getDetailedConstraints();
  await proposeFixSolutions();
}

main().catch(console.error);