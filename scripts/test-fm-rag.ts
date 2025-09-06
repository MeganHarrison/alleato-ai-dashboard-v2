/**
 * Test FM Global RAG System
 * 
 * PURPOSE: Test the complete FM Global RAG implementation
 * USAGE: tsx scripts/test-fm-rag.ts
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const API_URL = process.env.NODE_ENV === 'production' 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/fm-global-rag`
  : 'http://localhost:3000/api/fm-global-rag';

/**
 * Test the GET endpoint to check system status
 */
async function testStatus() {
  console.log('\n📊 Testing GET /api/fm-global-rag (Status Check)...');
  
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log('\n✅ API Status:');
    console.log(`   Service: ${data.service}`);
    console.log(`   Version: ${data.version}`);
    console.log(`   Database Status: ${data.database?.status}`);
    console.log(`   Figures Total: ${data.database?.figures?.total}`);
    console.log(`   Figures with Embeddings: ${data.database?.figures?.with_embeddings}`);
    console.log(`   Tables Total: ${data.database?.tables?.total}`);
    console.log(`   Tables with Embeddings: ${data.database?.tables?.with_embeddings}`);
    
    if (data.setup_instructions) {
      console.log('\n⚠️  Setup Required:');
      data.setup_instructions.forEach((step: string) => console.log(`   ${step}`));
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error checking status:', error);
    throw error;
  }
}

/**
 * Test a RAG query
 */
async function testQuery(
  query: string, 
  context: any = {}, 
  includeOptimizations: boolean = true
) {
  console.log(`\n🔍 Testing Query: "${query}"`);
  console.log(`   Context:`, JSON.stringify(context, null, 2));
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        context,
        includeOptimizations,
        limit: 5
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error} - ${error.details}`);
    }
    
    const data = await response.json();
    
    console.log('\n✅ Response Summary:');
    console.log(`   Content Length: ${data.content?.length || 0} characters`);
    console.log(`   Sources Retrieved: ${data.sources?.length || 0}`);
    console.log(`   Recommendations: ${data.recommendations?.length || 0}`);
    console.log(`   Tables Referenced: ${data.tables?.length || 0}`);
    console.log(`   Data Source: ${data.retrievedData?.dataSource}`);
    
    if (data.sources && data.sources.length > 0) {
      console.log('\n📚 Top Sources:');
      data.sources.slice(0, 3).forEach((source: any) => {
        console.log(`   - ${source.title} (Score: ${source.relevanceScore.toFixed(2)})`);
      });
    }
    
    if (data.recommendations && data.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      data.recommendations.forEach((rec: any) => {
        console.log(`   - ${rec.title} (${rec.type}, Impact: ${rec.impact})`);
        if (rec.costSavings) {
          console.log(`     Potential Savings: $${rec.costSavings.toLocaleString()}`);
        }
      });
    }
    
    console.log('\n📝 AI Response Preview:');
    console.log(data.content.substring(0, 500) + '...');
    
    return data;
  } catch (error) {
    console.error('❌ Error testing query:', error);
    throw error;
  }
}

/**
 * Run comprehensive test suite
 */
async function runTests() {
  console.log('🚀 Starting FM Global RAG System Tests...');
  console.log('📍 API URL:', API_URL);
  
  try {
    // Test 1: Check system status
    const status = await testStatus();
    
    if (status.database?.figures?.total === 0) {
      console.log('\n⚠️  No data in database. Please run:');
      console.log('   1. npm run fm:seed');
      console.log('   2. npm run generate:fm-embeddings');
      return;
    }
    
    // Test 2: Basic shuttle ASRS query
    await testQuery(
      'What are the sprinkler requirements for shuttle ASRS with closed-top containers?',
      {
        asrsType: 'shuttle',
        containerType: 'closed-top'
      }
    );
    
    // Test 3: Mini-load system query
    await testQuery(
      'How many sprinklers do I need for a mini-load ASRS system at 20ft height?',
      {
        asrsType: 'mini-load',
        storageHeight: 20
      }
    );
    
    // Test 4: Cost optimization query
    await testQuery(
      'What are the cost optimization opportunities for open-top containers?',
      {
        containerType: 'open-top',
        storageHeight: 30
      },
      true
    );
    
    // Test 5: K-factor requirements
    await testQuery(
      'What K-factor sprinklers are required for Class III commodities?',
      {
        commodityClass: 'Class III'
      }
    );
    
    // Test 6: Complex scenario
    await testQuery(
      'I have a 35ft high shuttle ASRS with open-top containers storing plastics. What protection do I need?',
      {
        asrsType: 'shuttle',
        containerType: 'open-top',
        storageHeight: 35,
        commodityClass: 'Plastics'
      }
    );
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

export { testStatus, testQuery };