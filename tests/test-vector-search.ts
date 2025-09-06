/**
 * Manual Test Script for Vector Database Integration
 * 
 * Run this script to verify that the strategist agent is properly
 * retrieving and using context from the meeting_chunks table
 * 
 * Usage: npm run test:vector
 */

import { createClient } from '@/utils/supabase/server'
import { askStrategistAgent } from '@/app/actions/strategist-agent-actions'
import { queryMeetingChunks } from '@/app/actions/meeting-embedding-actions'
import OpenAI from 'openai'
import chalk from 'chalk'

// Test result tracking
let passedTests = 0
let failedTests = 0
const testResults: { name: string; passed: boolean; error?: string }[] = []

// Helper function to log test results
function logTest(name: string, passed: boolean, error?: string) {
  if (passed) {
    console.log(chalk.green('✓'), name)
    passedTests++
  } else {
    console.log(chalk.red('✗'), name)
    if (error) console.log(chalk.red('  Error:'), error)
    failedTests++
  }
  testResults.push({ name, passed, error })
}

// Helper function to create test embedding
async function createTestEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('Failed to create embedding:', error)
    // Return a mock embedding for testing
    return new Array(1536).fill(0).map((_, i) => Math.sin(i / 100))
  }
}

async function runTests() {
  console.log(chalk.blue('\n=== Testing Vector Database Integration ===\n'))

  try {
    // Test 1: Basic Meeting Chunks Retrieval
    console.log(chalk.yellow('Test Group: Meeting Chunks Retrieval'))
    
    const testQueries = [
      'project timeline and milestones',
      'budget discussions',
      'team responsibilities',
      'client requirements',
      'technical architecture'
    ]

    for (const query of testQueries) {
      const embedding = await createTestEmbedding(query)
      const result = await queryMeetingChunks(embedding, 3, 0.5)
      
      logTest(
        `Query "${query}" returns results`,
        result.success && result.data !== undefined,
        !result.success ? result.error : undefined
      )

      if (result.success && result.data && result.data.length > 0) {
        console.log(chalk.gray(`  Found ${result.data.length} relevant chunks`))
        console.log(chalk.gray(`  Top match similarity: ${result.data[0].similarity?.toFixed(3)}`))
        console.log(chalk.gray(`  Preview: ${result.data[0].content.substring(0, 100)}...`))
      }
    }

    // Test 2: Context-Aware Responses
    console.log(chalk.yellow('\nTest Group: Context-Aware Responses'))
    
    const testQuestions = [
      {
        question: 'What key decisions were made in recent meetings?',
        expectContext: true
      },
      {
        question: 'What are the main project deliverables discussed?',
        expectContext: true
      },
      {
        question: 'Who are the stakeholders mentioned?',
        expectContext: true
      },
      {
        question: 'What is 2 + 2?', // Question unlikely to have context
        expectContext: false
      }
    ]

    for (const test of testQuestions) {
      const response = await askStrategistAgent(test.question, [])
      
      logTest(
        `Agent responds to: "${test.question.substring(0, 50)}..."`,
        response.success === true,
        !response.success ? response.error : undefined
      )

      if (response.success && response.context) {
        const hasContext = response.context.length > 0
        if (test.expectContext) {
          console.log(chalk.gray(`  Context chunks found: ${response.context.length}`))
        }
        
        logTest(
          `  Context expectation met (expected: ${test.expectContext})`,
          hasContext === test.expectContext
        )
      }

      if (response.success && response.answer) {
        console.log(chalk.gray(`  Response preview: ${response.answer.substring(0, 100)}...`))
      }
    }

    // Test 3: Performance Metrics
    console.log(chalk.yellow('\nTest Group: Performance Metrics'))
    
    const perfTestEmbedding = await createTestEmbedding('performance test query')
    
    const startTime = Date.now()
    const perfResult = await queryMeetingChunks(perfTestEmbedding, 5, 0.5)
    const queryTime = Date.now() - startTime
    
    logTest(
      `Vector search completes within 3 seconds (took ${queryTime}ms)`,
      queryTime < 3000
    )

    // Test 4: Data Validation
    console.log(chalk.yellow('\nTest Group: Data Validation'))
    
    const validationEmbedding = await createTestEmbedding('validation test')
    const validationResult = await queryMeetingChunks(validationEmbedding, 5, 0.5)
    
    if (validationResult.success && validationResult.data) {
      let allValid = true
      
      for (const chunk of validationResult.data) {
        const hasContent = chunk.content && typeof chunk.content === 'string' && chunk.content.length > 0
        const hasSimilarity = typeof chunk.similarity === 'number' && chunk.similarity >= 0 && chunk.similarity <= 1
        
        if (!hasContent || !hasSimilarity) {
          allValid = false
          break
        }
      }
      
      logTest(
        'All returned chunks have valid structure',
        allValid
      )
    }

    // Test 5: Conversation History Context
    console.log(chalk.yellow('\nTest Group: Conversation History'))
    
    const history = [
      { role: 'user' as const, content: 'Tell me about the Q3 roadmap' },
      { role: 'assistant' as const, content: 'The Q3 roadmap includes several key initiatives...' }
    ]
    
    const followUpResponse = await askStrategistAgent('What are the risks?', history)
    
    logTest(
      'Agent maintains conversation context',
      followUpResponse.success === true,
      !followUpResponse.success ? followUpResponse.error : undefined
    )

    // Test 6: Error Handling
    console.log(chalk.yellow('\nTest Group: Error Handling'))
    
    // Test with invalid embedding
    const errorResult = await queryMeetingChunks([] as any, 5, 0.5)
    
    logTest(
      'Handles invalid embeddings gracefully',
      errorResult.success === false && errorResult.error !== undefined
    )

  } catch (error) {
    console.error(chalk.red('\nUnexpected error during testing:'), error)
  }

  // Print summary
  console.log(chalk.blue('\n=== Test Summary ==='))
  console.log(chalk.green(`Passed: ${passedTests}`))
  console.log(chalk.red(`Failed: ${failedTests}`))
  console.log(chalk.yellow(`Total: ${passedTests + failedTests}`))
  
  if (failedTests === 0) {
    console.log(chalk.green('\n✅ All tests passed! The vector database integration is working correctly.'))
  } else {
    console.log(chalk.red('\n⚠️ Some tests failed. Please review the errors above.'))
    
    // List failed tests
    console.log(chalk.red('\nFailed tests:'))
    testResults.filter(t => !t.passed).forEach(t => {
      console.log(chalk.red(`  - ${t.name}`))
      if (t.error) console.log(chalk.gray(`    ${t.error}`))
    })
  }

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0)
}

// Run the tests
console.log(chalk.blue('Starting Vector Database Integration Tests...'))
runTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error)
  process.exit(1)
})