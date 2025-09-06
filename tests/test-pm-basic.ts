import { meetingRAGService } from '../lib/rag/meeting-service';
import { pmKnowledgeEngine } from '../lib/pm/knowledge-engine';

async function testBasicFunctionality() {
  console.log('Testing PM Assistant basic functionality...\n');

  try {
    // Test 1: Meeting RAG Service initialization
    console.log('Test 1: Testing Meeting RAG Service');
    const testQuery = 'project status';
    console.log(`Searching for: "${testQuery}"`);
    
    // This will fail if OpenAI API key is not set
    try {
      const context = await meetingRAGService.searchMeetingContext(testQuery, {
        matchCount: 5
      });
      console.log('✅ Meeting RAG Service initialized successfully');
      console.log(`Found ${context.chunks.length} chunks`);
    } catch (error: any) {
      if (error.message.includes('API key')) {
        console.log('⚠️  OpenAI API key not configured');
      } else {
        console.log('❌ Error:', error.message);
      }
    }

    // Test 2: PM Knowledge Engine
    console.log('\nTest 2: Testing PM Knowledge Engine');
    const mockContext = {
      chunks: [{
        content: 'The project is on track with all milestones met.',
        meeting_title: 'Weekly Status Update',
        meeting_date: new Date().toISOString(),
        chunk_type: 'general',
        similarity: 0.9,
        metadata: {},
        speakers: ['John Doe'],
        meeting_id: 'test-123'
      }],
      meetings: new Map(),
      insights: ['Project health is good']
    };

    const analysis = pmKnowledgeEngine.analyzeMeetingContext(mockContext, testQuery);
    console.log('✅ PM Knowledge Engine working');
    console.log('Project Status:', analysis.projectStatus);
    console.log('Recommendations:', analysis.recommendations.length);

    // Test 3: Check imports
    console.log('\nTest 3: Checking all imports');
    const modules = [
      '../app/actions/pm-chat-actions',
      '../app/api/pm-chat/route',
      '../components/ai-sdk5/enhanced-chat'
    ];

    for (const module of modules) {
      try {
        await import(module);
        console.log(`✅ ${module} imports successfully`);
      } catch (error: any) {
        console.log(`❌ ${module} failed:`, error.message.split('\n')[0]);
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testBasicFunctionality();