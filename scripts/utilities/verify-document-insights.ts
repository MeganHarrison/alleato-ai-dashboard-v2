import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const connectionString = process.env.DATABASE_URL!;

async function verifyDocumentInsights() {
  const client = new Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Check insights distribution
    console.log('📊 INSIGHTS DISTRIBUTION:\n');
    const distributionQuery = `
      SELECT 
        COUNT(*) as total_insights,
        COUNT(meeting_id) as with_meeting_id,
        COUNT(document_id) as with_document_id,
        COUNT(CASE WHEN meeting_id IS NOT NULL AND document_id IS NULL THEN 1 END) as meeting_only,
        COUNT(CASE WHEN meeting_id IS NULL AND document_id IS NOT NULL THEN 1 END) as document_only,
        COUNT(CASE WHEN meeting_id IS NOT NULL AND document_id IS NOT NULL THEN 1 END) as both,
        COUNT(CASE WHEN meeting_id IS NULL AND document_id IS NULL THEN 1 END) as neither
      FROM ai_insights;
    `;

    const distributionResult = await client.query(distributionQuery);
    console.table(distributionResult.rows);

    // 2. Check recent document insights
    console.log('\n📄 RECENT DOCUMENT INSIGHTS (Last 10):\n');
    const recentDocumentInsightsQuery = `
      SELECT 
        ai.id,
        ai.title,
        ai.insight_type,
        ai.severity,
        d.title as document_title,
        ai.created_at
      FROM 
        ai_insights ai
      JOIN 
        documents d ON ai.document_id = d.id
      WHERE 
        ai.document_id IS NOT NULL
      ORDER BY 
        ai.created_at DESC
      LIMIT 10;
    `;

    const recentDocumentInsights = await client.query(recentDocumentInsightsQuery);
    if (recentDocumentInsights.rows.length > 0) {
      console.table(recentDocumentInsights.rows);
    } else {
      console.log('No document insights found yet');
    }

    // 3. Check for any constraint violations
    console.log('\n🔍 CHECKING CONSTRAINT COMPLIANCE:\n');
    const constraintCheckQuery = `
      SELECT 
        id,
        meeting_id,
        document_id,
        CASE 
          WHEN meeting_id IS NOT NULL AND document_id IS NOT NULL THEN 'Both IDs set (potential issue)'
          WHEN meeting_id IS NULL AND document_id IS NULL THEN 'No parent set (potential issue)'
          WHEN meeting_id IS NOT NULL THEN 'Meeting insight (OK)'
          WHEN document_id IS NOT NULL THEN 'Document insight (OK)'
        END as status
      FROM 
        ai_insights
      WHERE 
        (meeting_id IS NOT NULL AND document_id IS NOT NULL) OR
        (meeting_id IS NULL AND document_id IS NULL)
      LIMIT 10;
    `;

    const constraintCheck = await client.query(constraintCheckQuery);
    if (constraintCheck.rows.length > 0) {
      console.log('⚠️ Found insights that may violate constraints:');
      console.table(constraintCheck.rows);
    } else {
      console.log('✅ All insights comply with constraints');
    }

    // 4. Group insights by document
    console.log('\n📈 INSIGHTS PER DOCUMENT (Top 10):\n');
    const insightsPerDocumentQuery = `
      SELECT 
        d.title as document_title,
        COUNT(ai.id) as insight_count,
        STRING_AGG(DISTINCT ai.insight_type, ', ') as insight_types,
        MAX(ai.created_at) as latest_insight
      FROM 
        documents d
      JOIN 
        ai_insights ai ON d.id = ai.document_id
      GROUP BY 
        d.id, d.title
      ORDER BY 
        COUNT(ai.id) DESC
      LIMIT 10;
    `;

    const insightsPerDocument = await client.query(insightsPerDocumentQuery);
    if (insightsPerDocument.rows.length > 0) {
      console.table(insightsPerDocument.rows);
    } else {
      console.log('No documents have insights yet');
    }

    // 5. Check if check constraint is working
    console.log('\n🔒 TESTING CHECK CONSTRAINT:\n');
    console.log('Attempting to insert an insight with both meeting_id and document_id...');
    
    try {
      // First get a valid meeting_id and document_id
      const meetingResult = await client.query('SELECT id FROM meetings LIMIT 1');
      const documentResult = await client.query('SELECT id FROM documents LIMIT 1');
      
      if (meetingResult.rows.length > 0 && documentResult.rows.length > 0) {
        const testInsertQuery = `
          INSERT INTO ai_insights (
            meeting_id, 
            document_id, 
            title, 
            description
          ) VALUES (
            $1, $2, 
            'Test Constraint', 
            'This should fail due to check constraint'
          );
        `;
        
        await client.query(testInsertQuery, [
          meetingResult.rows[0].id,
          documentResult.rows[0].id
        ]);
        
        console.log('❌ WARNING: Check constraint may not be working - insertion succeeded');
      } else {
        console.log('⏭️ Skipped test (no test data available)');
      }
    } catch (error: unknown) {
      if (error.code === '23514') { // check_violation
        console.log('✅ Check constraint is working correctly - prevented invalid insertion');
      } else {
        console.log('⚠️ Unexpected error:', error.message);
      }
    }

    // 6. Summary statistics
    console.log('\n📊 SUMMARY STATISTICS:\n');
    const summaryQuery = `
      SELECT 
        'Total Insights' as metric,
        COUNT(*) as value
      FROM ai_insights
      UNION ALL
      SELECT 
        'Documents with Insights' as metric,
        COUNT(DISTINCT document_id) as value
      FROM ai_insights
      WHERE document_id IS NOT NULL
      UNION ALL
      SELECT 
        'Meetings with Insights' as metric,
        COUNT(DISTINCT meeting_id) as value
      FROM ai_insights
      WHERE meeting_id IS NOT NULL
      UNION ALL
      SELECT 
        'Avg Insights per Document' as metric,
        ROUND(AVG(insight_count), 2) as value
      FROM (
        SELECT COUNT(*) as insight_count
        FROM ai_insights
        WHERE document_id IS NOT NULL
        GROUP BY document_id
      ) as doc_counts;
    `;

    const summary = await client.query(summaryQuery);
    console.table(summary.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
    console.log('\n🔌 Disconnected from database');
  }
}

verifyDocumentInsights().catch(console.error);