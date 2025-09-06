import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Sample meeting data for demonstration
const sampleMeetings = [
  {
    id: '1',
    title: 'Project Alpha Sprint Planning',
    date: '2025-08-27',
    summary: 'Discussed upcoming features for Q4. Team aligned on priorities for the next sprint.',
    action_items: [
      'John to complete API integration by EOW',
      'Sarah to review design mockups',
      'Team to update documentation'
    ],
    decisions: [
      'Approved new authentication flow',
      'Decided to delay feature X to Q1',
      'Agreed on 2-week sprint cadence'
    ],
    risks: [
      'Dependency on third-party service might cause delays',
      'Resource constraints in December',
      'Technical debt accumulation'
    ],
    participants: ['John Doe', 'Sarah Smith', 'Mike Johnson', 'Lisa Chen']
  },
  {
    id: '2',
    title: 'Quarterly Business Review',
    date: '2025-08-25',
    summary: 'Q3 performance review and Q4 planning. Revenue targets exceeded by 15%.',
    action_items: [
      'Finance team to prepare detailed Q4 budget',
      'Sales to update pipeline forecast',
      'Marketing to launch new campaign'
    ],
    decisions: [
      'Approved 20% increase in marketing budget',
      'Decided to expand to European market',
      'Hiring freeze lifted for engineering'
    ],
    risks: [
      'Market volatility may impact Q4 projections',
      'Competition increasing in core markets',
      'Supply chain concerns for hardware products'
    ],
    participants: ['CEO', 'CFO', 'VP Sales', 'VP Marketing', 'VP Engineering']
  },
  {
    id: '3',
    title: 'Engineering Architecture Review',
    date: '2025-08-20',
    summary: 'Technical discussion on microservices migration. Reviewed current architecture and proposed changes.',
    action_items: [
      'Create POC for service mesh implementation',
      'Document migration strategy',
      'Set up monitoring for new services'
    ],
    decisions: [
      'Adopt Kubernetes for container orchestration',
      'Use event-driven architecture for new services',
      'Implement API gateway pattern'
    ],
    risks: [
      'Migration complexity higher than estimated',
      'Potential downtime during cutover',
      'Team needs additional training'
    ],
    participants: ['Tech Lead', 'Senior Engineers', 'DevOps Team', 'CTO']
  }
];

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Invalid query' },
        { status: 400 }
      );
    }

    // Simple keyword matching for demo
    const queryLower = query.toLowerCase();
    let relevantMeetings = sampleMeetings;

    // Filter based on keywords
    if (queryLower.includes('risk')) {
      relevantMeetings = sampleMeetings.filter(m => 
        m.risks && m.risks.length > 0
      );
    } else if (queryLower.includes('decision')) {
      relevantMeetings = sampleMeetings.filter(m => 
        m.decisions && m.decisions.length > 0
      );
    } else if (queryLower.includes('action')) {
      relevantMeetings = sampleMeetings.filter(m => 
        m.action_items && m.action_items.length > 0
      );
    } else if (queryLower.includes('recent')) {
      relevantMeetings = sampleMeetings.slice(0, 2);
    }

    // Build context from relevant meetings
    let context = 'Based on the meeting data:\n\n';
    
    relevantMeetings.forEach((meeting, index) => {
      context += `**Meeting ${index + 1}: ${meeting.title}**\n`;
      context += `Date: ${meeting.date}\n`;
      context += `Summary: ${meeting.summary}\n`;
      
      if (queryLower.includes('risk') && meeting.risks) {
        context += `\nRisks identified:\n`;
        meeting.risks.forEach(risk => {
          context += `• ${risk}\n`;
        });
      }
      
      if (queryLower.includes('decision') && meeting.decisions) {
        context += `\nKey decisions:\n`;
        meeting.decisions.forEach(decision => {
          context += `• ${decision}\n`;
        });
      }
      
      if (queryLower.includes('action') && meeting.action_items) {
        context += `\nAction items:\n`;
        meeting.action_items.forEach(item => {
          context += `• ${item}\n`;
        });
      }
      
      context += '\n';
    });

    // Try to use OpenAI for better formatting
    const openaiApiKey = process.env.OPENAI_API_KEY;
    let answer = context;
    
    if (openaiApiKey) {
      try {
        const openai = new OpenAI({ apiKey: openaiApiKey });
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful meeting intelligence assistant. Summarize the meeting information concisely and directly answer the user\'s question.'
            },
            {
              role: 'user',
              content: `Question: ${query}\n\nMeeting Data:\n${context}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        });
        
        answer = completion.choices[0]?.message?.content || context;
      } catch (error) {
        console.log('OpenAI not available, using direct response');
      }
    }

    // Prepare sources
    const sources = relevantMeetings.map(meeting => ({
      meeting_id: meeting.id,
      title: meeting.title,
      date: meeting.date,
      similarity_score: 0.85 + Math.random() * 0.15 // Mock similarity score
    }));

    return NextResponse.json({
      answer,
      sources,
      insights: relevantMeetings.flatMap(m => [
        ...m.risks?.map(risk => ({ type: 'risk', content: risk })) || [],
        ...m.decisions?.map(decision => ({ type: 'decision', content: decision })) || [],
        ...m.action_items?.map(item => ({ type: 'action_item', content: item })) || []
      ]).slice(0, 5)
    });
    
  } catch (error) {
    console.error('Error in chat-demo API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}