"""
Generate AI insights from meetings and store them in the ai_insights table.
Analyzes meeting content to extract actionable insights, risks, decisions, and opportunities.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import logging
from dotenv import load_dotenv
from openai import AsyncOpenAI
from supabase import create_client
import re

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class InsightsGenerator:
    """Generate and store AI insights for meetings."""
    
    def __init__(self):
        """Initialize insights generator."""
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.client = AsyncOpenAI(api_key=self.openai_api_key)
        
        # Initialize Supabase
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
        self.supabase = create_client(url, key)
        
        # Insight types based on what's in the database
        self.insight_types = ["risk", "opportunity", "decision", "action_item", "strategic", "technical"]
        
        # Model for analysis
        self.model = "gpt-4-turbo"
    
    async def assign_project_to_meeting(self, meeting: Dict[str, Any]) -> Optional[int]:
        """Assign a project to a meeting based on content analysis."""
        
        # If already has a project, return it
        if meeting.get("project_id"):
            return meeting["project_id"]
        
        # Get all projects (remove state filter as it doesn't exist)
        projects_response = self.supabase.table("projects").select("*").execute()
        projects = projects_response.data if projects_response.data else []
        
        if not projects:
            logger.warning("No active projects found")
            return None
        
        # Prepare meeting content for analysis
        meeting_context = f"""
        Title: {meeting.get('title', '')}
        Participants: {', '.join(meeting.get('participants', []))}
        Summary: {meeting.get('summary', '')}
        Topics: {', '.join(meeting.get('topics', []))}
        Action Items: {'; '.join(meeting.get('action_items', []))}
        """
        
        # Prepare projects info
        projects_info = []
        for p in projects:
            project_info = {
                "id": p["id"],
                "name": p["name"],
                "description": p.get("description", ""),
                "keywords": p.get("keywords", []),
                "aliases": p.get("aliases", []),
                "stakeholders": p.get("stakeholders", [])
            }
            projects_info.append(project_info)
        
        prompt = f"""Analyze this meeting and determine which project it belongs to.
        
        Meeting Content:
        {meeting_context}
        
        Available Projects:
        {json.dumps(projects_info, indent=2)}
        
        Return ONLY a JSON object with:
        {{
            "project_id": <project_id or null if no match>,
            "confidence": <float 0-1>,
            "reasoning": "brief explanation"
        }}
        
        Match based on:
        1. Project name or aliases mentioned
        2. Keywords overlap
        3. Stakeholder involvement
        4. Topic relevance
        
        Only assign if confidence > 0.6
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a project assignment expert. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result_text = response.choices[0].message.content.strip()
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                
                if result.get("confidence", 0) > 0.6 and result.get("project_id"):
                    # Update meeting with project assignment
                    self.supabase.table("meetings").update({
                        "project_id": result["project_id"],
                        "assignment_confidence": result["confidence"],
                        "assignment_signals": {
                            "reasoning": result["reasoning"],
                            "assigned_at": datetime.now().isoformat()
                        }
                    }).eq("id", meeting["id"]).execute()
                    
                    logger.info(f"Assigned meeting to project {result['project_id']} with confidence {result['confidence']}")
                    return result["project_id"]
            
        except Exception as e:
            logger.error(f"Error assigning project: {e}")
        
        return None
    
    async def generate_insights(self, meeting: Dict[str, Any], project_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Generate insights from a meeting."""
        
        # Prepare meeting content
        meeting_content = f"""
        Meeting: {meeting.get('title', 'Untitled')}
        Date: {meeting.get('date', '')}
        Duration: {meeting.get('duration_minutes', 0)} minutes
        Participants: {', '.join(meeting.get('participants', []))}
        
        Summary: {meeting.get('summary', 'No summary available')}
        
        Topics Discussed: {', '.join(meeting.get('topics', []))}
        
        Action Items: {json.dumps(meeting.get('action_items', []), indent=2)}
        
        Decisions: {json.dumps(meeting.get('decisions', []), indent=2)}
        
        Risks Identified: {json.dumps(meeting.get('risks', []), indent=2)}
        """
        
        prompt = f"""Analyze this meeting and extract key insights.
        
        {meeting_content}
        
        Generate insights in these categories:
        1. RISKS - Potential problems, blockers, or concerns
        2. OPPORTUNITIES - Growth potential, improvements, new initiatives
        3. DECISIONS - Key decisions made or needed
        4. ACTION_ITEMS - Critical tasks with owners and deadlines
        5. STRATEGIC - Long-term implications or strategic considerations
        6. TECHNICAL - Technical challenges, solutions, or requirements
        
        Return a JSON array of insights, each with:
        {{
            "type": "risk|opportunity|decision|action_item|strategic|technical",
            "severity": "low|medium|high|critical" (for risks) or "importance": "low|medium|high" (for others),
            "title": "Brief descriptive title",
            "description": "Detailed description with context",
            "confidence": 0.0-1.0,
            "tags": ["relevant", "tags"]
        }}
        
        Focus on:
        - Actionable insights
        - Clear ownership and deadlines for action items
        - Quantifiable impacts where possible
        - Cross-functional implications
        - Dependencies and blockers
        
        Return 5-10 most important insights.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a senior project manager analyzing meeting insights. Return only valid JSON array."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.4,
                max_tokens=2000
            )
            
            result_text = response.choices[0].message.content.strip()
            # Extract JSON array from response
            json_match = re.search(r'\[.*\]', result_text, re.DOTALL)
            if json_match:
                insights = json.loads(json_match.group())
                
                # Add meeting and project context to each insight
                for insight in insights:
                    insight["meeting_id"] = meeting["id"]
                    insight["project_id"] = project_id
                    insight["source_meetings"] = meeting["id"]  # Can be comma-separated list later
                    
                return insights
            
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
        
        return []
    
    async def store_insights(self, insights: List[Dict[str, Any]]) -> int:
        """Store insights in the ai_insights table."""
        
        stored_count = 0
        
        for insight in insights:
            try:
                # Prepare insight data for database
                insight_data = {
                    "meeting_id": insight.get("meeting_id"),
                    "project_id": insight.get("project_id"),
                    "insight_type": insight.get("type", "general"),
                    "title": insight.get("title", ""),
                    "description": insight.get("description", ""),
                    "confidence_score": insight.get("confidence", 0.8),
                    "source_meetings": insight.get("source_meetings", ""),
                    "resolved": 0  # Default to unresolved
                }
                
                # Add meeting and project names if available
                if insight.get("meeting_name"):
                    insight_data["meeting_name"] = insight.get("meeting_name")
                if insight.get("project_name"):
                    insight_data["project_name"] = insight.get("project_name")
                
                # Add severity for risks, importance for others
                if insight.get("type") == "risk":
                    insight_data["severity"] = insight.get("severity", "medium")
                elif "importance" in insight:
                    insight_data["severity"] = insight.get("importance", "medium")
                
                # Store in database
                response = self.supabase.table("ai_insights").insert(insight_data).execute()
                
                if response.data:
                    stored_count += 1
                    logger.debug(f"Stored insight: {insight.get('title')}")
                
            except Exception as e:
                logger.error(f"Error storing insight: {e}")
        
        return stored_count
    
    async def process_meeting(self, meeting_id: str) -> Tuple[int, int]:
        """Process a single meeting to generate and store insights.
        
        Returns:
            Tuple of (project_id if assigned, number of insights created)
        """
        try:
            # Get meeting data
            response = self.supabase.table("meetings").select("*").eq("id", meeting_id).single().execute()
            
            if not response.data:
                logger.error(f"Meeting {meeting_id} not found")
                return (None, 0)
            
            meeting = response.data
            
            # Check if insights already exist for this meeting
            existing = self.supabase.table("ai_insights").select("id").eq("meeting_id", meeting_id).execute()
            if existing.data:
                logger.info(f"Insights already exist for meeting: {meeting['title']}")
                return (meeting.get("project_id"), len(existing.data))
            
            logger.info(f"Processing meeting: {meeting['title']}")
            
            # Assign project if needed
            project_id = await self.assign_project_to_meeting(meeting)
            
            # Generate insights
            insights = await self.generate_insights(meeting, project_id)
            
            if insights:
                # Store insights
                stored_count = await self.store_insights(insights)
                logger.info(f"✅ Generated {stored_count} insights for meeting: {meeting['title']}")
                return (project_id, stored_count)
            else:
                logger.warning(f"No insights generated for meeting: {meeting['title']}")
                return (project_id, 0)
                
        except Exception as e:
            logger.error(f"Error processing meeting {meeting_id}: {e}")
            return (None, 0)
    
    async def process_all_meetings(self, limit: Optional[int] = None):
        """Process all meetings to generate insights."""
        try:
            # Get all meetings
            query = self.supabase.table("meetings").select("id, title, project_id")
            if limit:
                query = query.limit(limit)
            
            response = query.execute()
            meetings = response.data
            
            logger.info(f"Found {len(meetings)} meetings to process")
            
            # Track statistics
            total_insights = 0
            meetings_with_projects = 0
            meetings_processed = 0
            
            for meeting in meetings:
                project_id, insights_count = await self.process_meeting(meeting["id"])
                
                if insights_count > 0:
                    meetings_processed += 1
                    total_insights += insights_count
                    
                if project_id:
                    meetings_with_projects += 1
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(0.5)
            
            logger.info(f"\n{'='*60}")
            logger.info(f"Insights Generation Complete:")
            logger.info(f"  Total meetings processed: {meetings_processed}/{len(meetings)}")
            logger.info(f"  Total insights created: {total_insights}")
            logger.info(f"  Meetings with projects: {meetings_with_projects}/{len(meetings)}")
            logger.info(f"{'='*60}")
            
            return {
                "meetings_processed": meetings_processed,
                "total_insights": total_insights,
                "meetings_with_projects": meetings_with_projects
            }
            
        except Exception as e:
            logger.error(f"Error processing meetings: {e}")
            raise
    
    async def generate_project_summary(self, project_id: int) -> Dict[str, Any]:
        """Generate a summary of insights for a specific project."""
        try:
            # Get all insights for the project
            response = self.supabase.table("ai_insights").select("*").eq("project_id", project_id).execute()
            insights = response.data
            
            if not insights:
                return {"error": "No insights found for this project"}
            
            # Categorize insights
            summary = {
                "project_id": project_id,
                "total_insights": len(insights),
                "by_type": {},
                "critical_items": [],
                "recent_decisions": [],
                "open_risks": [],
                "pending_actions": []
            }
            
            for insight in insights:
                # Count by type
                insight_type = insight.get("insight_type", "other")
                summary["by_type"][insight_type] = summary["by_type"].get(insight_type, 0) + 1
                
                # Collect critical items
                if insight.get("severity") in ["high", "critical"]:
                    summary["critical_items"].append({
                        "title": insight["title"],
                        "type": insight_type,
                        "severity": insight["severity"]
                    })
                
                # Collect recent decisions
                if insight_type == "decision":
                    summary["recent_decisions"].append(insight["title"])
                
                # Collect open risks
                if insight_type == "risk" and not insight.get("resolved"):
                    summary["open_risks"].append({
                        "title": insight["title"],
                        "severity": insight.get("severity", "medium")
                    })
                
                # Collect pending actions
                if insight_type == "action_item" and not insight.get("resolved"):
                    summary["pending_actions"].append(insight["title"])
            
            # Limit lists to most recent/important
            summary["critical_items"] = summary["critical_items"][:5]
            summary["recent_decisions"] = summary["recent_decisions"][:5]
            summary["open_risks"] = summary["open_risks"][:5]
            summary["pending_actions"] = summary["pending_actions"][:10]
            
            return summary
            
        except Exception as e:
            logger.error(f"Error generating project summary: {e}")
            return {"error": str(e)}


async def main():
    """Generate insights for all meetings."""
    generator = InsightsGenerator()
    
    # Process all meetings (or limit for testing)
    results = await generator.process_all_meetings(limit=None)  # Set limit=10 for testing
    
    print(f"\n✨ Insights generation complete!")
    print(f"   Processed {results['meetings_processed']} meetings")
    print(f"   Generated {results['total_insights']} insights")
    print(f"   Assigned {results['meetings_with_projects']} meetings to projects")


if __name__ == "__main__":
    asyncio.run(main())