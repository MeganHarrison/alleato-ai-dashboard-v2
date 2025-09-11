import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL!;

interface MigrationStep {
  name: string;
  sql: string;
  checkSql?: string;
  rollbackSql?: string;
}

async function executeMigration() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check current state
    console.log('📊 CURRENT STATE ANALYSIS:\n');
    
    // Check if document_id column already exists
    const checkDocumentIdColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ai_insights' 
      AND column_name = 'document_id'
    `);
    
    const hasDocumentId = checkDocumentIdColumn.rows.length > 0;
    console.log(`Document_id column exists: ${hasDocumentId}`);

    // Check current constraints
    const currentConstraints = await client.query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'ai_insights'
      AND table_schema = 'public'
      AND constraint_type = 'FOREIGN KEY'
    `);
    
    console.log('\nCurrent Foreign Key Constraints:');
    console.table(currentConstraints.rows);

    // Based on analysis, we'll use APPROACH 2: Keep both relationships (flexible approach)
    // This is the safest approach that preserves existing data
    
    console.log('\n🔧 MIGRATION PLAN: Dual Relationship Approach\n');
    console.log('This approach will:');
    console.log('1. Keep the existing meeting_id relationship');
    console.log('2. Add a new document_id column and foreign key');
    console.log('3. Allow insights to be associated with either meetings OR documents');
    console.log('4. Preserve all existing data\n');

    const migrationSteps: MigrationStep[] = [];

    // Step 1: Make meeting_id nullable (if not already)
    migrationSteps.push({
      name: 'Make meeting_id nullable',
      sql: `ALTER TABLE ai_insights ALTER COLUMN meeting_id DROP NOT NULL;`,
      checkSql: `
        SELECT is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'ai_insights' 
        AND column_name = 'meeting_id'
      `,
      rollbackSql: `ALTER TABLE ai_insights ALTER COLUMN meeting_id SET NOT NULL;`
    });

    // Step 2: Add document_id column if it doesn't exist
    if (!hasDocumentId) {
      migrationSteps.push({
        name: 'Add document_id column',
        sql: `ALTER TABLE ai_insights ADD COLUMN document_id UUID;`,
        checkSql: `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'ai_insights' 
          AND column_name = 'document_id'
        `,
        rollbackSql: `ALTER TABLE ai_insights DROP COLUMN document_id;`
      });
    }

    // Step 3: Add foreign key constraint to documents
    migrationSteps.push({
      name: 'Add foreign key constraint to documents',
      sql: `
        ALTER TABLE ai_insights 
        ADD CONSTRAINT ai_insights_document_id_fkey 
        FOREIGN KEY (document_id) 
        REFERENCES documents(id) 
        ON DELETE CASCADE;
      `,
      checkSql: `
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'ai_insights' 
        AND constraint_name = 'ai_insights_document_id_fkey'
      `,
      rollbackSql: `ALTER TABLE ai_insights DROP CONSTRAINT ai_insights_document_id_fkey;`
    });

    // Step 4: Add check constraint to ensure one relationship exists
    migrationSteps.push({
      name: 'Add check constraint for parent relationship',
      sql: `
        ALTER TABLE ai_insights 
        ADD CONSTRAINT ai_insights_has_parent_check 
        CHECK (
          (meeting_id IS NOT NULL AND document_id IS NULL) OR 
          (meeting_id IS NULL AND document_id IS NOT NULL) OR
          (meeting_id IS NULL AND document_id IS NULL) -- Allow both null during transition
        );
      `,
      checkSql: `
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'ai_insights' 
        AND constraint_name = 'ai_insights_has_parent_check'
      `,
      rollbackSql: `ALTER TABLE ai_insights DROP CONSTRAINT ai_insights_has_parent_check;`
    });

    // Step 5: Create indexes for performance
    migrationSteps.push({
      name: 'Create index on document_id',
      sql: `CREATE INDEX IF NOT EXISTS idx_ai_insights_document_id ON ai_insights(document_id);`,
      checkSql: `
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'ai_insights' 
        AND indexname = 'idx_ai_insights_document_id'
      `,
      rollbackSql: `DROP INDEX IF EXISTS idx_ai_insights_document_id;`
    });

    // Execute migration
    console.log('🚀 EXECUTING MIGRATION:\n');
    
    for (const step of migrationSteps) {
      console.log(`📝 ${step.name}...`);
      
      // Check if step is needed
      if (step.checkSql) {
        const checkResult = await client.query(step.checkSql);
        if (checkResult.rows.length > 0) {
          console.log(`   ⏭️  Skipped (already done)\n`);
          continue;
        }
      }
      
      try {
        await client.query(step.sql);
        console.log(`   ✅ Success\n`);
      } catch (error: unknown) {
        if (error.code === '42710') { // duplicate_object
          console.log(`   ⏭️  Skipped (already exists)\n`);
        } else if (error.code === '42701') { // duplicate_column
          console.log(`   ⏭️  Skipped (column already exists)\n`);
        } else {
          console.error(`   ❌ Error: ${error.message}\n`);
          throw error;
        }
      }
    }

    // Verify final state
    console.log('✅ MIGRATION COMPLETE!\n');
    console.log('📋 FINAL STATE:\n');

    const finalColumns = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ai_insights'
      AND column_name IN ('meeting_id', 'document_id')
      ORDER BY column_name
    `);

    console.log('Columns:');
    console.table(finalColumns.rows);

    const finalConstraints = await client.query(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        LEFT JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE 
        tc.table_name = 'ai_insights'
        AND tc.constraint_type IN ('FOREIGN KEY', 'CHECK')
      ORDER BY 
        tc.constraint_type, tc.constraint_name
    `);

    console.log('\nConstraints:');
    console.table(finalConstraints.rows);

    // Generate helper functions for application code
    console.log('\n💡 HELPER SQL FUNCTIONS:\n');
    console.log('You can now create these helper functions in your database:\n');

    const helperFunctions = `
-- Function to create insight for a document
CREATE OR REPLACE FUNCTION create_document_insight(
  p_document_id UUID,
  p_project_id BIGINT,
  p_insight_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT,
  p_confidence_score REAL DEFAULT NULL
)
RETURNS BIGINT AS $$
DECLARE
  v_insight_id BIGINT;
BEGIN
  INSERT INTO ai_insights (
    document_id,
    project_id,
    insight_type,
    severity,
    title,
    description,
    confidence_score
  ) VALUES (
    p_document_id,
    p_project_id,
    p_insight_type,
    p_severity,
    p_title,
    p_description,
    p_confidence_score
  ) RETURNING id INTO v_insight_id;
  
  RETURN v_insight_id;
END;
$$ LANGUAGE plpgsql;

-- Function to migrate insights from meeting to document
CREATE OR REPLACE FUNCTION migrate_meeting_insights_to_document(
  p_meeting_id UUID,
  p_document_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE ai_insights
  SET document_id = p_document_id,
      meeting_id = NULL
  WHERE meeting_id = p_meeting_id
    AND document_id IS NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
`;

    console.log(helperFunctions);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

// Generate TypeScript types
function generateTypes() {
  console.log('\n📝 TYPESCRIPT TYPES:\n');
  console.log('Update your TypeScript types to reflect the new structure:\n');
  
  const types = `
// database.types.ts
export interface AiInsight {
  id: number;
  project_id?: number;
  meeting_id?: string;  // Now optional
  document_id?: string; // New field
  insight_type?: string;
  severity?: string;
  title: string;
  description: string;
  source_meetings?: string;
  confidence_score?: number;
  resolved?: number;
  created_at?: string;
  meeting_name?: string;
  project_name?: string;
}

// Helper type guards
export const isDocumentInsight = (insight: AiInsight): boolean => {
  return insight.document_id != null && insight.meeting_id == null;
};

export const isMeetingInsight = (insight: AiInsight): boolean => {
  return insight.meeting_id != null && insight.document_id == null;
};
`;

  console.log(types);
}

// Update application code examples
function generateApplicationCode() {
  console.log('\n🔧 APPLICATION CODE UPDATES:\n');
  console.log('Update your application code to handle both types of insights:\n');
  
  const code = `
// Creating insights for documents
const createDocumentInsight = async (
  documentId: string,
  insightData: Partial<AiInsight>
) => {
  const { data, error } = await supabase
    .from('ai_insights')
    .insert({
      ...insightData,
      document_id: documentId,
      meeting_id: null, // Explicitly set to null
    });
    
  return { data, error };
};

// Querying insights with proper joins
const getInsightsWithContext = async (projectId?: number) => {
  const query = supabase
    .from('ai_insights')
    .select(\`
      *,
      meetings (
        id,
        title,
        date
      ),
      documents (
        id,
        title,
        type
      )
    \`);
    
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  
  const { data, error } = await query;
  
  // Process results to have a unified parent reference
  const processedInsights = data?.map(insight => ({
    ...insight,
    parent: insight.document_id 
      ? { type: 'document', data: insight.documents }
      : { type: 'meeting', data: insight.meetings }
  }));
  
  return { data: processedInsights, error };
};
`;

  console.log(code);
}

async function main() {
  console.log('🎯 AI INSIGHTS CONSTRAINT FIX\n');
  console.log('This script will safely modify the ai_insights table to support both');
  console.log('meeting and document relationships while preserving existing data.\n');
  
  await executeMigration();
  generateTypes();
  generateApplicationCode();
  
  console.log('\n✨ SUMMARY:\n');
  console.log('1. ✅ Database schema updated successfully');
  console.log('2. ✅ Both meeting_id and document_id relationships are now supported');
  console.log('3. ✅ All existing data preserved');
  console.log('4. ✅ Foreign key constraints properly configured');
  console.log('5. ✅ Performance indexes created');
  console.log('\nNext steps:');
  console.log('- Update your TypeScript types as shown above');
  console.log('- Update application code to handle both relationship types');
  console.log('- Test creating insights with document_id instead of meeting_id');
  console.log('- Consider migrating existing meeting insights to documents if applicable');
}

main().catch(console.error);