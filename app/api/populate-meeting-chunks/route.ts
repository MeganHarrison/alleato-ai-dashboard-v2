import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import OpenAI from "openai"

// Sample meeting content for testing
const SAMPLE_MEETING_CHUNKS = [
  {
    content: "In today's quarterly review meeting, we discussed the Q3 performance metrics. Revenue increased by 15% compared to Q2, exceeding our targets. The sales team successfully closed three major enterprise deals worth over $2M in total revenue.",
    chunk_type: "summary",
    meeting_title: "Q3 Quarterly Business Review"
  },
  {
    content: "The product roadmap for Q4 includes launching the new AI-powered analytics dashboard, improving the user onboarding experience, and implementing enterprise SSO. The engineering team estimates 6 weeks for the analytics dashboard development.",
    chunk_type: "action_items",
    meeting_title: "Product Planning Session"
  },
  {
    content: "Key risks identified: dependency on third-party API providers, potential delays in hiring senior engineers, and market competition from emerging startups. Mitigation strategies include developing fallback options and accelerating the recruitment process.",
    chunk_type: "risks",
    meeting_title: "Risk Assessment Meeting"
  },
  {
    content: "Budget allocation for Q4: 40% to engineering and product development, 30% to sales and marketing, 20% to operations, and 10% reserved for strategic initiatives. Total budget approved: $5M for the quarter.",
    chunk_type: "decisions",
    meeting_title: "Budget Planning Meeting"
  },
  {
    content: "Customer feedback highlights: Users love the intuitive interface but request more customization options. Top feature requests include advanced reporting, API access, and mobile app improvements. NPS score improved from 42 to 56.",
    chunk_type: "feedback",
    meeting_title: "Customer Success Review"
  },
  {
    content: "Team expansion plans: Hiring 5 engineers, 3 sales representatives, and 2 customer success managers by end of Q4. Focus on senior-level talent with experience in B2B SaaS. Budget approved for competitive compensation packages.",
    chunk_type: "planning",
    meeting_title: "Hiring Strategy Meeting"
  },
  {
    content: "Partnership opportunities discussed with three potential integration partners. TechCorp showed strong interest in a strategic partnership. Next steps: technical feasibility assessment and commercial terms negotiation by month end.",
    chunk_type: "opportunities",
    meeting_title: "Partnership Discussion"
  },
  {
    content: "Marketing campaign results: Q3 campaign generated 500 qualified leads, 30% conversion to trial, 15% trial to paid conversion. Cost per acquisition decreased by 25%. Recommendation to increase digital marketing budget by 20%.",
    chunk_type: "metrics",
    meeting_title: "Marketing Performance Review"
  }
]

export async function POST() {
  try {
    const supabase = await createClient()
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    
    // Check if we already have data
    const { count: existingCount } = await supabase
      .from("meeting_chunks")
      .select("*", { count: "exact", head: true })
    
    if (existingCount && existingCount > 0) {
      return NextResponse.json({ 
        message: `Meeting chunks already exist (${existingCount} chunks). Delete existing data first if you want to repopulate.`,
        count: existingCount
      })
    }

    const results = []
    
    // Process each chunk
    for (let i = 0; i < SAMPLE_MEETING_CHUNKS.length; i++) {
      const chunk = SAMPLE_MEETING_CHUNKS[i]
      
      try {
        // Generate embedding for the chunk content
        const embeddingResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: chunk.content,
        })
        
        const embedding = embeddingResponse.data[0].embedding
        
        // Insert the chunk with its embedding
        const { data, error } = await supabase
          .from("meeting_chunks")
          .insert({
            content: chunk.content,
            chunk_type: chunk.chunk_type,
            chunk_index: i,
            embedding: `[${embedding.join(",")}]`, // Store as string in PostgreSQL vector format
            meeting_id: `sample-meeting-${i}`, // Fake meeting ID for testing
            metadata: {
              meeting_title: chunk.meeting_title,
              created_for_testing: true,
              created_at: new Date().toISOString()
            },
            start_timestamp: i * 300, // Fake timestamps (5 minutes apart)
            end_timestamp: (i + 1) * 300,
            speaker_info: {
              primary_speaker: "Sample Speaker",
              participants: ["John Doe", "Jane Smith", "Bob Johnson"]
            }
          })
          .select()
        
        if (error) {
          results.push({ 
            chunk: chunk.meeting_title, 
            status: "error", 
            error: error.message 
          })
        } else {
          results.push({ 
            chunk: chunk.meeting_title, 
            status: "success",
            id: data[0]?.id
          })
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch (err: any) {
        results.push({ 
          chunk: chunk.meeting_title, 
          status: "error", 
          error: err.message 
        })
      }
    }
    
    // Count successful insertions
    const successCount = results.filter(r => r.status === "success").length
    
    return NextResponse.json({ 
      message: `Populated ${successCount} out of ${SAMPLE_MEETING_CHUNKS.length} meeting chunks with embeddings`,
      results,
      success: successCount === SAMPLE_MEETING_CHUNKS.length
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to populate meeting chunks",
      details: error.message 
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    
    // Delete only test data (with metadata indicating it was created for testing)
    const { error, count } = await supabase
      .from("meeting_chunks")
      .delete()
      .eq("metadata->>created_for_testing", "true")
    
    if (error) {
      return NextResponse.json({ 
        error: "Failed to delete test data",
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      message: `Deleted ${count || 0} test meeting chunks`,
      count: count || 0
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to delete meeting chunks",
      details: error.message 
    }, { status: 500 })
  }
}