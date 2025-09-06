"""
Meeting Intelligence System for AI-powered insights and project assignment.
Uses GPT-5 (or GPT-4) for advanced analysis of meeting transcripts.
"""

import os
import re
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import asyncio

from openai import AsyncOpenAI
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import numpy as np
from textblob import TextBlob

from fireflies_client import FirefliesTranscript

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class IntelligenceSettings(BaseSettings):
    """Settings for meeting intelligence system."""
    
    openai_api_key: str = Field(..., description="OpenAI API key")
    intelligence_model: str = Field(
        default="gpt-4-turbo-preview",  # Will use GPT-5 when available
        description="Model for intelligence analysis"
    )
    embedding_model: str = Field(
        default="text-embedding-3-large",
        description="Model for generating embeddings"
    )
    max_tokens: int = Field(
        default=2000,
        description="Maximum tokens for responses"
    )
    temperature: float = Field(
        default=0.3,
        description="Temperature for intelligence generation"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields


class RiskLevel(str, Enum):
    """Risk level classification."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ActionPriority(str, Enum):
    """Action item priority."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


@dataclass
class MeetingInsights:
    """Structured meeting insights."""
    
    summary: str = ""
    action_items: List[Dict[str, Any]] = field(default_factory=list)
    decisions: List[str] = field(default_factory=list)
    risks: List[Dict[str, Any]] = field(default_factory=list)
    topics: List[str] = field(default_factory=list)
    sentiment_score: float = 0.0
    key_points: List[str] = field(default_factory=list)
    follow_ups: List[str] = field(default_factory=list)
    stakeholder_mentions: Dict[str, int] = field(default_factory=dict)
    project_references: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class MeetingIntelligence:
    """AI-powered meeting analysis and intelligence extraction."""
    
    def __init__(self, settings: Optional[IntelligenceSettings] = None):
        """Initialize meeting intelligence system."""
        self.settings = settings or IntelligenceSettings()
        self.client = AsyncOpenAI(api_key=self.settings.openai_api_key)
    
    async def analyze_transcript(
        self,
        transcript: FirefliesTranscript
    ) -> Dict[str, Any]:
        """Perform comprehensive analysis of meeting transcript."""
        
        logger.info(f"Analyzing transcript: {transcript.title}")
        
        # Generate structured insights
        insights = await self._extract_structured_insights(transcript)
        
        # Generate embedding for semantic search
        embedding = await self._generate_embedding(
            f"{transcript.title} {insights.summary}"
        )
        
        # Analyze sentiment
        sentiment_score = self._analyze_sentiment(transcript.transcript_text)
        
        # Extract project references
        project_refs = self._extract_project_references(transcript.transcript_text)
        
        # Identify key stakeholders
        stakeholders = self._identify_stakeholders(
            transcript.transcript_text,
            transcript.participants
        )
        
        return {
            "summary": insights.summary,
            "action_items": [self._format_action_item(item) for item in insights.action_items],
            "decisions": insights.decisions,
            "risks": [self._format_risk(risk) for risk in insights.risks],
            "topics": insights.topics,
            "sentiment_score": sentiment_score,
            "key_points": insights.key_points,
            "follow_ups": insights.follow_ups,
            "embedding": embedding,
            "metadata": {
                "stakeholder_mentions": stakeholders,
                "project_references": project_refs,
                "analysis_timestamp": datetime.now().isoformat(),
                "model_used": self.settings.intelligence_model,
                **insights.metadata
            }
        }
    
    async def _extract_structured_insights(
        self,
        transcript: FirefliesTranscript
    ) -> MeetingInsights:
        """Extract structured insights using GPT-5/4."""
        
        prompt = f"""
        Analyze this meeting transcript and extract structured insights.
        
        Meeting: {transcript.title}
        Date: {transcript.date}
        Participants: {', '.join(transcript.participants)}
        
        Transcript:
        {transcript.transcript_text[:8000]}  # Limit context length
        
        Please provide:
        
        1. EXECUTIVE SUMMARY (2-3 sentences capturing the essence)
        
        2. ACTION ITEMS (list with owner, deadline if mentioned, and priority):
        Format: "- [OWNER]: [ACTION] (Priority: HIGH/MEDIUM/LOW, Due: [DATE if mentioned])"
        
        3. KEY DECISIONS (list of decisions made):
        Format: "- [DECISION]"
        
        4. RISKS IDENTIFIED (list with severity):
        Format: "- [RISK] (Severity: CRITICAL/HIGH/MEDIUM/LOW)"
        
        5. MAIN TOPICS DISCUSSED (list of 3-5 main topics)
        
        6. KEY POINTS (3-5 most important points from the meeting)
        
        7. FOLLOW-UPS NEEDED (list of items requiring follow-up)
        
        8. PROJECT REFERENCES (any projects or initiatives mentioned)
        
        Provide response in a structured format.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.settings.intelligence_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert meeting analyst specializing in extracting actionable insights from meeting transcripts."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=self.settings.temperature,
                max_tokens=self.settings.max_tokens
            )
            
            content = response.choices[0].message.content
            
            # Parse the response
            insights = self._parse_gpt_response(content)
            
            return insights
            
        except Exception as e:
            logger.error(f"Error extracting insights: {e}")
            return MeetingInsights(
                summary=transcript.summary or "Meeting analysis failed",
                action_items=transcript.action_items,
                topics=transcript.topics
            )
    
    def _parse_gpt_response(self, content: str) -> MeetingInsights:
        """Parse GPT response into structured insights."""
        
        insights = MeetingInsights()
        
        # Extract sections using regex
        sections = {
            "summary": r"EXECUTIVE SUMMARY[:\s]+(.*?)(?=\n\d+\.|$)",
            "action_items": r"ACTION ITEMS[:\s]+(.*?)(?=\n\d+\.|$)",
            "decisions": r"KEY DECISIONS[:\s]+(.*?)(?=\n\d+\.|$)",
            "risks": r"RISKS IDENTIFIED[:\s]+(.*?)(?=\n\d+\.|$)",
            "topics": r"MAIN TOPICS[:\s]+(.*?)(?=\n\d+\.|$)",
            "key_points": r"KEY POINTS[:\s]+(.*?)(?=\n\d+\.|$)",
            "follow_ups": r"FOLLOW-UPS[:\s]+(.*?)(?=\n\d+\.|$)",
            "project_refs": r"PROJECT REFERENCES[:\s]+(.*?)(?=\n\d+\.|$)"
        }
        
        for key, pattern in sections.items():
            match = re.search(pattern, content, re.IGNORECASE | re.DOTALL)
            if match:
                text = match.group(1).strip()
                
                if key == "summary":
                    insights.summary = text
                
                elif key == "action_items":
                    items = re.findall(r"- (.*?)(?=\n-|$)", text, re.DOTALL)
                    for item in items:
                        parsed = self._parse_action_item(item)
                        if parsed:
                            insights.action_items.append(parsed)
                
                elif key == "decisions":
                    items = re.findall(r"- (.*?)(?=\n-|$)", text, re.DOTALL)
                    insights.decisions = [item.strip() for item in items]
                
                elif key == "risks":
                    items = re.findall(r"- (.*?)(?=\n-|$)", text, re.DOTALL)
                    for item in items:
                        parsed = self._parse_risk(item)
                        if parsed:
                            insights.risks.append(parsed)
                
                elif key == "topics":
                    items = re.findall(r"- (.*?)(?=\n-|$)", text, re.DOTALL)
                    insights.topics = [item.strip() for item in items[:5]]
                
                elif key == "key_points":
                    items = re.findall(r"- (.*?)(?=\n-|$)", text, re.DOTALL)
                    insights.key_points = [item.strip() for item in items[:5]]
                
                elif key == "follow_ups":
                    items = re.findall(r"- (.*?)(?=\n-|$)", text, re.DOTALL)
                    insights.follow_ups = [item.strip() for item in items]
                
                elif key == "project_refs":
                    items = re.findall(r"- (.*?)(?=\n-|$)", text, re.DOTALL)
                    insights.project_references = [item.strip() for item in items]
        
        return insights
    
    def _parse_action_item(self, text: str) -> Dict[str, Any]:
        """Parse action item text into structured format."""
        
        # Extract owner
        owner_match = re.match(r"\[?(.*?)\]?:\s*(.*)", text)
        if owner_match:
            owner = owner_match.group(1).strip()
            action = owner_match.group(2).strip()
        else:
            owner = "Unassigned"
            action = text.strip()
        
        # Extract priority
        priority = ActionPriority.MEDIUM
        if re.search(r"priority:\s*urgent|urgent|asap", action, re.IGNORECASE):
            priority = ActionPriority.URGENT
        elif re.search(r"priority:\s*high|high\s*priority", action, re.IGNORECASE):
            priority = ActionPriority.HIGH
        elif re.search(r"priority:\s*low|low\s*priority", action, re.IGNORECASE):
            priority = ActionPriority.LOW
        
        # Extract due date
        due_date = None
        date_match = re.search(r"due:\s*([^,\)]+)", action, re.IGNORECASE)
        if date_match:
            due_date = date_match.group(1).strip()
        
        # Clean action text
        action = re.sub(r"\(.*?\)", "", action).strip()
        
        return {
            "owner": owner,
            "action": action,
            "priority": priority.value,
            "due_date": due_date
        }
    
    def _parse_risk(self, text: str) -> Dict[str, Any]:
        """Parse risk text into structured format."""
        
        # Extract severity
        severity = RiskLevel.MEDIUM
        if re.search(r"severity:\s*critical|critical", text, re.IGNORECASE):
            severity = RiskLevel.CRITICAL
        elif re.search(r"severity:\s*high|high\s*risk", text, re.IGNORECASE):
            severity = RiskLevel.HIGH
        elif re.search(r"severity:\s*low|low\s*risk", text, re.IGNORECASE):
            severity = RiskLevel.LOW
        
        # Clean risk text
        risk = re.sub(r"\(.*?\)", "", text).strip()
        
        return {
            "risk": risk,
            "severity": severity.value
        }
    
    def _format_action_item(self, item: Dict[str, Any]) -> str:
        """Format action item for storage."""
        parts = [f"[{item['owner']}] {item['action']}"]
        
        if item.get("priority") and item["priority"] != "medium":
            parts.append(f"Priority: {item['priority'].upper()}")
        
        if item.get("due_date"):
            parts.append(f"Due: {item['due_date']}")
        
        return " | ".join(parts)
    
    def _format_risk(self, risk: Dict[str, Any]) -> str:
        """Format risk for storage."""
        return f"{risk['risk']} (Severity: {risk['severity'].upper()})"
    
    async def _generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text."""
        try:
            response = await self.client.embeddings.create(
                model=self.settings.embedding_model,
                input=text[:8000]  # Limit input length
            )
            
            return response.data[0].embedding
            
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * 1536
    
    def _analyze_sentiment(self, text: str) -> float:
        """Analyze overall sentiment of meeting."""
        try:
            # Use TextBlob for basic sentiment analysis
            blob = TextBlob(text[:5000])  # Limit text length
            
            # Polarity ranges from -1 (negative) to 1 (positive)
            # Convert to 0-1 scale
            sentiment = (blob.sentiment.polarity + 1) / 2
            
            return round(sentiment, 3)
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return 0.5  # Neutral
    
    def _extract_project_references(self, text: str) -> List[str]:
        """Extract project names and references from text."""
        projects = []
        
        # Common project patterns
        patterns = [
            r"(?:project|initiative|program)\s+(?:called\s+)?[\"']?([A-Z][A-Za-z0-9\s-]+)[\"']?",
            r"(?:the\s+)?([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)\s+(?:project|initiative)",
            r"(?:working\s+on|developing|building)\s+([A-Z][A-Za-z0-9\s-]+)",
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                project = match.strip()
                if len(project) > 3 and project not in projects:
                    projects.append(project)
        
        return projects[:10]  # Limit to top 10
    
    def _identify_stakeholders(
        self,
        text: str,
        participants: List[str]
    ) -> Dict[str, int]:
        """Identify key stakeholders and their mention frequency."""
        stakeholders = {}
        
        # Count mentions of each participant
        for participant in participants:
            # Handle different name formats
            names = [participant]
            if " " in participant:
                # Add first name only
                names.append(participant.split()[0])
            
            count = 0
            for name in names:
                pattern = rf"\b{re.escape(name)}\b"
                mentions = len(re.findall(pattern, text, re.IGNORECASE))
                count += mentions
            
            if count > 0:
                stakeholders[participant] = count
        
        # Sort by mention frequency
        sorted_stakeholders = dict(
            sorted(stakeholders.items(), key=lambda x: x[1], reverse=True)
        )
        
        return sorted_stakeholders
    
    async def generate_project_assignment_confidence(
        self,
        meeting_text: str,
        project_name: str,
        project_keywords: List[str]
    ) -> float:
        """Generate confidence score for project assignment."""
        
        prompt = f"""
        Analyze if this meeting is related to the project "{project_name}".
        
        Project keywords: {', '.join(project_keywords)}
        
        Meeting excerpt:
        {meeting_text[:3000]}
        
        Provide a confidence score from 0.0 to 1.0 where:
        - 0.0-0.3: Unlikely related
        - 0.3-0.6: Possibly related
        - 0.6-0.8: Likely related
        - 0.8-1.0: Definitely related
        
        Consider:
        1. Direct project name mentions
        2. Keyword overlap
        3. Topic relevance
        4. Participant overlap (if known)
        
        Return only the numeric score.
        """
        
        try:
            response = await self.client.chat.completions.create(
                model=self.settings.intelligence_model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a project assignment expert. Return only a confidence score between 0.0 and 1.0."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.1,
                max_tokens=10
            )
            
            score_text = response.choices[0].message.content.strip()
            score = float(score_text)
            
            return min(max(score, 0.0), 1.0)  # Ensure in range
            
        except Exception as e:
            logger.error(f"Error generating confidence score: {e}")
            return 0.0


# Example usage
async def example_usage():
    """Example of using meeting intelligence."""
    
    # Create sample transcript
    transcript = FirefliesTranscript(
        id="test123",
        title="Product Development Weekly Sync",
        date=datetime.now(),
        duration_minutes=45,
        participants=["John Smith", "Jane Doe", "Bob Johnson"],
        transcript_text="""
        John: Welcome everyone to our weekly product sync. Let's start with updates.
        
        Jane: The new authentication feature is progressing well. We should have it ready for testing by Friday.
        
        Bob: Great! I have a concern about the database performance with the new queries. 
        We might need to add some indexes.
        
        John: That's a valid point. Jane, can you work with Bob to optimize those queries? 
        This is high priority.
        
        Jane: Absolutely. I'll set up time with Bob tomorrow.
        
        John: Perfect. Also, we need to finalize the API documentation by next week for the partner integration.
        
        Bob: I can handle that. Should have it ready by Monday.
        
        John: Excellent. Any other blockers or concerns?
        
        Jane: Just a reminder that we have the security audit coming up next month. 
        We should start preparing.
        
        John: Good point. Let's make that a focus for next week's meeting. 
        Thanks everyone!
        """
    )
    
    # Analyze transcript
    intelligence = MeetingIntelligence()
    insights = await intelligence.analyze_transcript(transcript)
    
    print("Meeting Insights:")
    print(f"Summary: {insights['summary']}")
    print(f"Action Items: {insights['action_items']}")
    print(f"Decisions: {insights['decisions']}")
    print(f"Risks: {insights['risks']}")
    print(f"Topics: {insights['topics']}")
    print(f"Sentiment: {insights['sentiment_score']}")


if __name__ == "__main__":
    asyncio.run(example_usage())