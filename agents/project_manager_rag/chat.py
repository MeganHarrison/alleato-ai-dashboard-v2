#!/usr/bin/env python3
"""
Improved chat interface that actually retrieves and uses meeting content.
"""

import asyncio
import os
import sys
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import logging
from dotenv import load_dotenv
from openai import AsyncOpenAI
from supabase import create_client
import json

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# Suppress verbose logs
for module in ['httpx', 'openai', 'supabase', 'httpcore']:
    logging.getLogger(module).setLevel(logging.WARNING)


class BetterRAGChat:
    """Improved RAG chat that actually retrieves meeting content."""
    
    def __init__(self):
        """Initialize the chat system."""
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY not found")
        
        self.openai = AsyncOpenAI(api_key=self.openai_api_key)
        
        # Supabase setup
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        self.supabase = create_client(url, key)
        
        self.model = "gpt-4-turbo"
        
    def search_meetings_by_text(self, query: str, limit: int = 5) -> List[Dict]:
        """Search meetings by text content."""
        try:
            # First, try to find meetings by title or content
            keywords = query.lower().split()
            
            # Get recent meetings
            response = self.supabase.table("meetings")\
                .select("*")\
                .order("date", desc=True)\
                .limit(30)\
                .execute()
            
            if not response.data:
                return []
            
            # Score meetings based on keyword matches
            scored_meetings = []
            for meeting in response.data:
                score = 0
                meeting_text = f"{meeting.get('title', '')} {meeting.get('summary', '')} {' '.join(meeting.get('topics', []))}".lower()
                
                for keyword in keywords:
                    if keyword in meeting_text:
                        score += 1
                
                # Also check for date mentions
                if 'weekly' in query.lower() and 'weekly' in meeting_text:
                    score += 2
                if 'operations' in query.lower() and 'operations' in meeting_text:
                    score += 2
                    
                if score > 0:
                    scored_meetings.append((meeting, score))
            
            # Sort by score and return top matches
            scored_meetings.sort(key=lambda x: x[1], reverse=True)
            return [m[0] for m in scored_meetings[:limit]]
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            return []
    
    def get_meeting_by_title(self, title_keywords: str) -> Optional[Dict]:
        """Get a specific meeting by title keywords."""
        try:
            response = self.supabase.table("meetings")\
                .select("*")\
                .ilike("title", f"%{title_keywords}%")\
                .order("date", desc=True)\
                .limit(1)\
                .execute()
            
            return response.data[0] if response.data else None
            
        except Exception as e:
            logger.error(f"Failed to get meeting by title: {e}")
            return None
    
    def get_recent_meetings(self, days: int = 7) -> List[Dict]:
        """Get meetings from the last N days."""
        try:
            cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
            
            response = self.supabase.table("meetings")\
                .select("*")\
                .gte("date", cutoff_date)\
                .order("date", desc=True)\
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Failed to get recent meetings: {e}")
            return []
    
    def get_insights_for_meetings(self, meeting_ids: List[str]) -> List[Dict]:
        """Get insights for specific meetings."""
        try:
            if not meeting_ids:
                return []
            
            response = self.supabase.table("ai_insights")\
                .select("*")\
                .in_("meeting_id", meeting_ids)\
                .execute()
            
            return response.data if response.data else []
            
        except Exception as e:
            logger.error(f"Failed to get insights: {e}")
            return []
    
    async def answer_question(self, question: str) -> str:
        """Answer a question with actual meeting data."""
        
        # Search for relevant meetings
        meetings = self.search_meetings_by_text(question, limit=5)
        
        # If no specific meetings found, get recent ones
        if not meetings:
            meetings = self.get_recent_meetings(days=7)[:5]
        
        # Get insights for these meetings
        meeting_ids = [m['id'] for m in meetings if m.get('id')]
        insights = self.get_insights_for_meetings(meeting_ids)
        
        # Build detailed context
        context = self._build_detailed_context(meetings, insights, question)
        
        # Generate answer
        answer = await self._generate_detailed_answer(question, context)
        
        return answer
    
    def _build_detailed_context(self, meetings: List[Dict], insights: List[Dict], question: str) -> str:
        """Build detailed context from meetings and insights."""
        parts = []
        
        if meetings:
            parts.append("MEETING DETAILS:\n")
            for m in meetings[:5]:
                parts.append(f"\n═══ {m.get('title', 'Untitled Meeting')} ═══")
                parts.append(f"Date: {m.get('date', 'Unknown date')}")
                
                if m.get('participants'):
                    parts.append(f"Participants: {', '.join(m['participants'][:10])}")
                
                if m.get('summary'):
                    parts.append(f"\nSummary:\n{m['summary']}")
                
                if m.get('topics'):
                    parts.append(f"\nTopics Discussed:")
                    for topic in m['topics'][:10]:
                        parts.append(f"  • {topic}")
                
                if m.get('action_items'):
                    parts.append(f"\nAction Items:")
                    for item in m['action_items'][:10]:
                        parts.append(f"  ✓ {item}")
                
                if m.get('decisions'):
                    parts.append(f"\nDecisions Made:")
                    for decision in m['decisions'][:5]:
                        parts.append(f"  → {decision}")
                
                if m.get('risks'):
                    parts.append(f"\nRisks Identified:")
                    for risk in m['risks'][:5]:
                        parts.append(f"  ⚠ {risk}")
                
                parts.append("")  # Empty line between meetings
        
        if insights:
            parts.append("\n\nAI-GENERATED INSIGHTS:\n")
            
            # Group insights by type
            by_type = {}
            for i in insights:
                insight_type = i.get('insight_type', 'general')
                if insight_type not in by_type:
                    by_type[insight_type] = []
                by_type[insight_type].append(i)
            
            for itype, items in by_type.items():
                parts.append(f"\n{itype.upper()}:")
                for item in items[:5]:
                    parts.append(f"  • {item.get('title', 'Untitled')}")
                    if item.get('description'):
                        parts.append(f"    {item['description'][:200]}")
        
        return "\n".join(parts) if parts else "No specific meeting data found."
    
    async def _generate_detailed_answer(self, question: str, context: str) -> str:
        """Generate a detailed answer using the full context."""
        try:
            messages = [
                {
                    "role": "system",
                    "content": """You are a helpful project management assistant with access to detailed meeting records. 
                    Answer questions based on the actual meeting content provided. Be specific and reference actual 
                    data from the meetings. If you have the information, provide it. If not, say what information 
                    you do have available."""
                },
                {
                    "role": "user",
                    "content": f"""Based on the following meeting data, answer this question: {question}

Meeting Data:
{context}

Provide a detailed, specific answer using the actual meeting information above. Reference specific meetings, 
people, dates, and details from the data provided."""
                }
            ]
            
            response = await self.openai.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.3,
                max_tokens=800
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            return f"Error generating answer: {str(e)}"


async def interactive_session():
    """Run an interactive Q&A session with better responses."""
    print("\n" + "="*70)
    print("🤖 Project Manager RAG - Better Chat")
    print("="*70)
    print("\nThis improved version actually retrieves and uses your meeting data!")
    print("\nCommands:")
    print("  'exit' or 'quit' - Exit the chat")
    print("  'recent' - Show recent meetings")
    print("  'help' - Show example questions")
    print("\nStart asking questions!\n")
    
    chat = BetterRAGChat()
    
    example_questions = [
        "What was discussed in the weekly operations meeting?",
        "What are Jack Curtin's action items?",
        "Tell me about the Goodwill Bloomington project",
        "What risks have been identified?",
        "Who attended recent meetings?",
        "What decisions were made about ADA compliance?",
        "What needs Nick Jepson's attention?"
    ]
    
    while True:
        try:
            # Get user input
            user_input = input("\n💬 You: ").strip()
            
            # Handle commands
            if user_input.lower() in ['exit', 'quit', 'q']:
                print("\n👋 Goodbye!\n")
                break
            
            elif user_input.lower() == 'help':
                print("\n📝 Example questions you can ask:")
                for q in example_questions:
                    print(f"  • {q}")
                continue
            
            elif user_input.lower() == 'recent':
                print("\n📅 Recent meetings:")
                recent = chat.get_recent_meetings(days=7)
                for m in recent[:10]:
                    print(f"  • {m.get('date', '')}: {m.get('title', 'Untitled')}")
                continue
            
            elif not user_input:
                continue
            
            # Process the question
            print("\n🔍 Retrieving meeting data...\n")
            answer = await chat.answer_question(user_input)
            
            # Display answer with formatting
            print("="*70)
            print("🤖 Answer:\n")
            print(answer)
            print("="*70)
            
        except KeyboardInterrupt:
            print("\n\n👋 Exiting chat...\n")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            print("Please try rephrasing your question.\n")


def main():
    """Main entry point."""
    print("\n🚀 Starting Better RAG Chat...")
    print("Loading models and connecting to database...\n")
    
    try:
        asyncio.run(interactive_session())
    except Exception as e:
        print(f"\n❌ Failed to start chat: {e}")
        print("\nMake sure you have:")
        print("  1. Set up your .env file with API keys")
        print("  2. Meetings in your database")
        sys.exit(1)


if __name__ == "__main__":
    main()