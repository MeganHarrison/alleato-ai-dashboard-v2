import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL!;

async function queryConstraints() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Get all constraints on ai_insights table
    console.log('📊 ALL CONSTRAINTS ON ai_insights TABLE:\n');
    const constraintsQuery = `
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
        tc.constraint_type DESC, tc.constraint_name;
    `;

    const constraintsResult = await client.query(constraintsQuery);
    console.table(constraintsResult.rows);

    // 2. Get column information for ai_insights
    console.log('\n📋 COLUMNS IN ai_insights TABLE:\n');
    const columnsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'ai_insights'
        AND table_schema = 'public'
      ORDER BY 
        ordinal_position;
    `;

    const columnsResult = await client.query(columnsQuery);
    console.table(columnsResult.rows);

    // 3. Check if meetings table has document_id
    console.log('\n🔗 MEETINGS TABLE STRUCTURE:\n');
    const meetingsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'meetings'
        AND table_schema = 'public'
        AND column_name IN ('id', 'document_id', 'notion_page_id')
      ORDER BY 
        ordinal_position;
    `;

    const meetingsResult = await client.query(meetingsQuery);
    console.table(meetingsResult.rows);

    // 4. Check documents table structure
    console.log('\n📄 DOCUMENTS TABLE STRUCTURE:\n');
    const documentsQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'documents'
        AND table_schema = 'public'
        AND column_name IN ('id', 'notion_page_id', 'title', 'type')
      ORDER BY 
        ordinal_position;
    `;

    const documentsResult = await client.query(documentsQuery);
    console.table(documentsResult.rows);

    // 5. Check if there's a relationship between meetings and documents
    console.log('\n🔍 CHECKING MEETINGS-DOCUMENTS RELATIONSHIP:\n');
    const relationshipQuery = `
      SELECT 
        m.id as meeting_id,
        m.document_id,
        d.id as document_id_exists,
        d.title as document_title
      FROM 
        meetings m
      LEFT JOIN 
        documents d ON m.document_id = d.id
      WHERE 
        m.document_id IS NOT NULL
      LIMIT 5;
    `;

    const relationshipResult = await client.query(relationshipQuery);
    if (relationshipResult.rows.length > 0) {
      console.log('Sample meetings with document_id:');
      console.table(relationshipResult.rows);
    } else {
      console.log('No meetings have document_id set');
    }

    // 6. Count insights by parent type
    console.log('\n📈 AI INSIGHTS STATISTICS:\n');
    const statsQuery = `
      SELECT 
        COUNT(*) as total_insights,
        COUNT(meeting_id) as with_meeting_id,
        COUNT(DISTINCT meeting_id) as unique_meetings
      FROM 
        ai_insights;
    `;

    const statsResult = await client.query(statsQuery);
    console.table(statsResult.rows);

    // 7. Check for orphaned insights
    console.log('\n⚠️ CHECKING FOR ORPHANED INSIGHTS:\n');
    const orphanedQuery = `
      SELECT 
        ai.id,
        ai.meeting_id,
        m.id as meeting_exists
      FROM 
        ai_insights ai
      LEFT JOIN 
        meetings m ON ai.meeting_id = m.id
      WHERE 
        m.id IS NULL
        AND ai.meeting_id IS NOT NULL
      LIMIT 5;
    `;

    const orphanedResult = await client.query(orphanedQuery);
    if (orphanedResult.rows.length > 0) {
      console.log('⚠️ Found orphaned insights (meeting_id references non-existent meetings):');
      console.table(orphanedResult.rows);
    } else {
      console.log('✅ No orphaned insights found');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

queryConstraints().catch(console.error);