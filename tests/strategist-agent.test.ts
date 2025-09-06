/**
 * Test Suite for Strategist Agent with Vector Database Integration
 * 
 * This test ensures that the strategist agent is properly retrieving
 * and utilizing context from the meeting_chunks vector database
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@/utils/supabase/server'
import { askStrategistAgent } from '@/app/actions/strategist-agent-actions'
import { queryMeetingChunks } from '@/app/actions/meeting-embedding-actions'
import OpenAI from 'openai'

// Mock OpenAI for predictable testing
const mockOpenAI = {
  embeddings: {
    create: jest.fn()
  },
  chat: {
    completions: {
      create: jest.fn()
    }
  }
}

describe('Strategist Agent Vector Database Integration', () => {
  let testEmbedding: number[]
  let supabase: any

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient()
    
    // Create a test embedding (normally this would come from OpenAI)
    // Using a simple test embedding for consistency
    testEmbedding = new Array(1536).fill(0).map((_, i) => Math.sin(i / 100))
  })

  describe('Meeting Chunks Retrieval', () => {
    it('should successfully query meeting chunks from the database', async () => {
      const result = await queryMeetingChunks(testEmbedding, 5, 0.5)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      
      if (result.success && result.data) {
        expect(Array.isArray(result.data)).toBe(true)
        
        // Check structure of returned chunks
        if (result.data.length > 0) {
          const firstChunk = result.data[0]
          expect(firstChunk).toHaveProperty('content')
          expect(firstChunk).toHaveProperty('meeting_title')
          expect(firstChunk).toHaveProperty('similarity')
          expect(typeof firstChunk.content).toBe('string')
          expect(typeof firstChunk.similarity).toBe('number')
        }
      }
    })

    it('should return chunks sorted by similarity score', async () => {
      const result = await queryMeetingChunks(testEmbedding, 5, 0.5)
      
      if (result.success && result.data && result.data.length > 1) {
        const similarities = result.data.map(chunk => chunk.similarity)
        const sortedSimilarities = [...similarities].sort((a, b) => b - a)
        expect(similarities).toEqual(sortedSimilarities)
      }
    })

    it('should respect the match count parameter', async () => {
      const matchCount = 3
      const result = await queryMeetingChunks(testEmbedding, matchCount, 0.5)
      
      if (result.success && result.data) {
        expect(result.data.length).toBeLessThanOrEqual(matchCount)
      }
    })

    it('should filter results by similarity threshold', async () => {
      const threshold = 0.7
      const result = await queryMeetingChunks(testEmbedding, 10, threshold)
      
      if (result.success && result.data && result.data.length > 0) {
        result.data.forEach(chunk => {
          expect(chunk.similarity).toBeGreaterThanOrEqual(threshold)
        })
      }
    })
  })

  describe('Context-Aware Response Generation', () => {
    it('should include meeting context in agent responses', async () => {
      // Mock OpenAI to return predictable embeddings and responses
      const mockEmbedding = new Array(1536).fill(0).map((_, i) => i / 1536)
      
      jest.spyOn(global, 'OpenAI').mockImplementation(() => ({
        embeddings: {
          create: jest.fn().mockResolvedValue({
            data: [{ embedding: mockEmbedding }]
          })
        },
        chat: {
          completions: {
            create: jest.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'Based on the meeting context, here is my response...'
                }
              }]
            })
          }
        }
      } as any))

      const question = "What was discussed in recent meetings?"
      const history = []
      
      const response = await askStrategistAgent(question, history)
      
      expect(response.success).toBe(true)
      expect(response.answer).toBeDefined()
      expect(response.context).toBeDefined()
    })

    it('should handle questions without relevant context gracefully', async () => {
      const question = "What is the weather like?"
      const history = []
      
      const response = await askStrategistAgent(question, history)
      
      expect(response.success).toBe(true)
      expect(response.answer).toBeDefined()
      // Even without relevant context, should provide a response
      expect(response.answer).not.toBe('')
    })

    it('should maintain conversation history context', async () => {
      const history = [
        { role: 'user' as const, content: 'Tell me about project X' },
        { role: 'assistant' as const, content: 'Project X is a key initiative...' }
      ]
      const question = "What are the next steps?"
      
      const response = await askStrategistAgent(question, history)
      
      expect(response.success).toBe(true)
      expect(response.answer).toBeDefined()
      // Response should be contextual to the history
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // Simulate a database error by using invalid embedding
      const invalidEmbedding = null as any
      
      const result = await queryMeetingChunks(invalidEmbedding, 5, 0.7)
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should handle OpenAI API errors gracefully', async () => {
      // Mock OpenAI to throw an error
      jest.spyOn(global, 'OpenAI').mockImplementation(() => ({
        embeddings: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      } as any))

      const question = "Test question"
      const response = await askStrategistAgent(question, [])
      
      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
    })
  })

  describe('Performance and Quality', () => {
    it('should retrieve context within acceptable time limits', async () => {
      const startTime = Date.now()
      const result = await queryMeetingChunks(testEmbedding, 5, 0.5)
      const endTime = Date.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(3000) // Should complete within 3 seconds
      expect(result.success).toBe(true)
    })

    it('should provide relevant context for business questions', async () => {
      // Test with actual business-related questions
      const businessQuestions = [
        "What are our key performance indicators?",
        "What decisions were made about the budget?",
        "Who are the stakeholders mentioned in meetings?",
        "What are the main project risks discussed?"
      ]
      
      for (const question of businessQuestions) {
        const response = await askStrategistAgent(question, [])
        
        expect(response.success).toBe(true)
        if (response.context && response.context.length > 0) {
          // If context is found, it should be relevant
          expect(response.answer).not.toContain('I don\'t have information')
        }
      }
    })
  })

  describe('Data Validation', () => {
    it('should validate meeting chunk data structure', async () => {
      const result = await queryMeetingChunks(testEmbedding, 1, 0.5)
      
      if (result.success && result.data && result.data.length > 0) {
        const chunk = result.data[0]
        
        // Validate required fields
        expect(chunk).toHaveProperty('content')
        expect(chunk).toHaveProperty('similarity')
        
        // Validate data types
        expect(typeof chunk.content).toBe('string')
        expect(typeof chunk.similarity).toBe('number')
        
        // Validate optional fields if present
        if (chunk.meeting_title) {
          expect(typeof chunk.meeting_title).toBe('string')
        }
        if (chunk.meeting_date) {
          expect(typeof chunk.meeting_date).toBe('string')
        }
        if (chunk.metadata) {
          expect(typeof chunk.metadata).toBe('object')
        }
      }
    })

    it('should handle empty or null content appropriately', async () => {
      const result = await queryMeetingChunks(testEmbedding, 10, 0.5)
      
      if (result.success && result.data) {
        result.data.forEach(chunk => {
          expect(chunk.content).not.toBe(null)
          expect(chunk.content).not.toBe(undefined)
          expect(chunk.content.length).toBeGreaterThan(0)
        })
      }
    })
  })

  afterAll(async () => {
    // Clean up any test data if needed
    jest.restoreAllMocks()
  })
})