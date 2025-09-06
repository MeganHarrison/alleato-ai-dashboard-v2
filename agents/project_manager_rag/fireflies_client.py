"""
Fireflies API Client for automated meeting transcript sync and processing.
"""

import os
import asyncio
import hashlib
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass, field
import httpx
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class FirefliesSettings(BaseSettings):
    """Fireflies API configuration settings."""
    
    fireflies_api_key: str = Field(..., description="Fireflies API key")
    fireflies_api_url: str = Field(
        default="https://api.fireflies.ai/graphql",
        description="Fireflies GraphQL API endpoint"
    )
    fireflies_sync_interval_hours: int = Field(
        default=1,
        description="Interval in hours for syncing transcripts"
    )
    fireflies_max_retries: int = Field(
        default=3,
        description="Maximum retry attempts for API calls"
    )
    fireflies_timeout_seconds: int = Field(
        default=30,
        description="API call timeout in seconds"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields in .env


@dataclass
class FirefliesTranscript:
    """Fireflies meeting transcript data model."""
    
    id: str
    title: str
    date: datetime
    duration_minutes: int
    participants: List[str] = field(default_factory=list)
    transcript_text: str = ""
    summary: Optional[str] = None
    action_items: List[str] = field(default_factory=list)
    topics: List[str] = field(default_factory=list)
    meeting_url: Optional[str] = None
    recording_url: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_markdown(self) -> str:
        """Convert transcript to markdown format."""
        md_lines = [
            f"# {self.title}",
            f"**Date:** {self.date.strftime('%Y-%m-%d %H:%M')}",
            f"**Duration:** {self.duration_minutes} minutes",
            f"**Participants:** {', '.join(self.participants)}",
            ""
        ]
        
        if self.summary:
            md_lines.extend([
                "## Summary",
                self.summary,
                ""
            ])
        
        if self.action_items:
            md_lines.extend([
                "## Action Items",
                *[f"- {item}" for item in self.action_items],
                ""
            ])
        
        if self.topics:
            md_lines.extend([
                "## Topics Discussed",
                *[f"- {topic}" for topic in self.topics],
                ""
            ])
        
        md_lines.extend([
            "## Transcript",
            self.transcript_text,
            ""
        ])
        
        if self.meeting_url:
            md_lines.append(f"**Meeting URL:** {self.meeting_url}")
        
        if self.recording_url:
            md_lines.append(f"**Recording:** {self.recording_url}")
        
        return "\n".join(md_lines)
    
    def generate_filename(self) -> str:
        """Generate a unique filename for the transcript."""
        date_str = self.date.strftime("%Y%m%d_%H%M")
        title_slug = "".join(c if c.isalnum() or c in "-_" else "_" 
                             for c in self.title.lower())[:50]
        return f"{date_str}_{title_slug}_{self.id[:8]}.md"


class FirefliesClient:
    """Client for interacting with Fireflies API."""
    
    def __init__(self, settings: Optional[FirefliesSettings] = None):
        """Initialize Fireflies client with settings."""
        self.settings = settings or FirefliesSettings()
        self.headers = {
            "Authorization": f"Bearer {self.settings.fireflies_api_key}",
            "Content-Type": "application/json"
        }
        self.client = httpx.AsyncClient(
            timeout=self.settings.fireflies_timeout_seconds,
            headers=self.headers
        )
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.client.aclose()
    
    async def _execute_query(self, query: str, variables: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute a GraphQL query against Fireflies API."""
        payload = {
            "query": query,
            "variables": variables or {}
        }
        
        for attempt in range(self.settings.fireflies_max_retries):
            try:
                response = await self.client.post(
                    self.settings.fireflies_api_url,
                    json=payload
                )
                response.raise_for_status()
                result = response.json()
                
                if "errors" in result:
                    logger.error(f"GraphQL errors: {result['errors']}")
                    raise Exception(f"GraphQL errors: {result['errors']}")
                
                return result.get("data", {})
                
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error (attempt {attempt + 1}): {e}")
                if attempt == self.settings.fireflies_max_retries - 1:
                    raise
                await asyncio.sleep(2 ** attempt)
            
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                raise
    
    async def get_transcripts(
        self, 
        since: Optional[datetime] = None,
        limit: int = 50
    ) -> List[FirefliesTranscript]:
        """Fetch transcripts from Fireflies API."""
        
        # Simpler query that's more likely to work
        query = """
        query {
            transcripts {
                id
                title
                date
                duration
                participants
                sentences {
                    text
                    speaker_name
                }
                summary
                organizer_email
                meeting_url
            }
        }
        """
        
        # For now, don't use variables with the simpler query
        data = await self._execute_query(query)
        transcripts = []
        
        for item in data.get("transcripts", []):
            # Parse participants - handle both list and string formats
            participants_data = item.get("participants", [])
            if isinstance(participants_data, list):
                participants = [
                    p.get("name", p.get("email", "Unknown")) if isinstance(p, dict) else str(p)
                    for p in participants_data
                ]
            else:
                participants = [str(participants_data)] if participants_data else []
            
            # Parse action items
            action_items = item.get("action_items", []) if item.get("action_items") else []
            user_action_items = []
            if item.get("user_action_items"):
                user_action_items = [
                    f"{ai['text']} (assigned to: {ai.get('user_email', 'unassigned')})"
                    for ai in item.get("user_action_items", [])
                ]
            all_action_items = action_items + user_action_items
            
            # Build full transcript from sentences
            sentences = item.get("sentences", [])
            if sentences:
                transcript_lines = [
                    f"[{s.get('start_time', 0)}s] {s.get('speaker_name', 'Unknown')}: {s.get('text', '')}"
                    for s in sentences
                ]
                full_transcript = "\n".join(transcript_lines)
            else:
                full_transcript = item.get("transcript", "")
            
            # Parse date
            date_str = item.get("date", "")
            try:
                meeting_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except:
                meeting_date = datetime.now()
            
            transcript = FirefliesTranscript(
                id=item.get("id", ""),
                title=item.get("title", "Untitled Meeting"),
                date=meeting_date,
                duration_minutes=int(item.get("duration", 0) / 60),
                participants=participants,
                transcript_text=full_transcript,
                summary=item.get("summary"),
                action_items=all_action_items,
                topics=[],  # Will be extracted later
                meeting_url=item.get("meeting_url"),
                recording_url=item.get("audio_url") or item.get("video_url"),
                metadata={
                    "organizer": item.get("organizer_email"),
                    "fireflies_id": item.get("id")
                }
            )
            
            transcripts.append(transcript)
        
        return transcripts
    
    async def get_transcript_by_id(self, transcript_id: str) -> Optional[FirefliesTranscript]:
        """Fetch a specific transcript by ID."""
        
        query = """
        query GetTranscript($transcriptId: String!) {
            transcript(id: $transcriptId) {
                id
                title
                date
                duration
                participants {
                    name
                    email
                }
                transcript
                summary
                action_items
                sentences {
                    text
                    speaker_name
                    start_time
                }
                user_action_items {
                    text
                    user_email
                }
                organizer_email
                meeting_url
                audio_url
                video_url
            }
        }
        """
        
        variables = {"transcriptId": transcript_id}
        data = await self._execute_query(query, variables)
        
        item = data.get("transcript")
        if not item:
            return None
        
        # Parse using same logic as get_transcripts
        participants = [
            p.get("name", p.get("email", "Unknown"))
            for p in item.get("participants", [])
        ]
        
        action_items = item.get("action_items", [])
        user_action_items = [
            f"{ai['text']} (assigned to: {ai.get('user_email', 'unassigned')})"
            for ai in item.get("user_action_items", [])
        ]
        all_action_items = action_items + user_action_items
        
        sentences = item.get("sentences", [])
        if sentences:
            transcript_lines = [
                f"[{s.get('start_time', 0)}s] {s.get('speaker_name', 'Unknown')}: {s.get('text', '')}"
                for s in sentences
            ]
            full_transcript = "\n".join(transcript_lines)
        else:
            full_transcript = item.get("transcript", "")
        
        date_str = item.get("date", "")
        try:
            meeting_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except:
            meeting_date = datetime.now()
        
        return FirefliesTranscript(
            id=item.get("id", ""),
            title=item.get("title", "Untitled Meeting"),
            date=meeting_date,
            duration_minutes=int(item.get("duration", 0) / 60),
            participants=participants,
            transcript_text=full_transcript,
            summary=item.get("summary"),
            action_items=all_action_items,
            topics=[],
            meeting_url=item.get("meeting_url"),
            recording_url=item.get("audio_url") or item.get("video_url"),
            metadata={
                "organizer": item.get("organizer_email"),
                "fireflies_id": item.get("id")
            }
        )
    
    async def search_transcripts(
        self,
        query_text: str,
        limit: int = 10
    ) -> List[FirefliesTranscript]:
        """Search transcripts using Fireflies search API."""
        
        query = """
        query SearchTranscripts($searchQuery: String!, $limit: Int!) {
            search(query: $searchQuery, limit: $limit) {
                transcript_id
                title
                date
                snippet
                relevance_score
            }
        }
        """
        
        variables = {
            "searchQuery": query_text,
            "limit": limit
        }
        
        data = await self._execute_query(query, variables)
        search_results = data.get("search", [])
        
        # Fetch full transcripts for search results
        transcripts = []
        for result in search_results:
            transcript_id = result.get("transcript_id")
            if transcript_id:
                transcript = await self.get_transcript_by_id(transcript_id)
                if transcript:
                    # Add search relevance to metadata
                    transcript.metadata["search_relevance"] = result.get("relevance_score", 0)
                    transcript.metadata["search_snippet"] = result.get("snippet", "")
                    transcripts.append(transcript)
        
        return transcripts


class FirefliesSyncManager:
    """Manager for automated Fireflies transcript syncing."""
    
    def __init__(
        self,
        client: FirefliesClient,
        storage_callback = None
    ):
        """Initialize sync manager."""
        self.client = client
        self.storage_callback = storage_callback
        self.last_sync_time: Optional[datetime] = None
        self.synced_ids: set = set()
    
    async def sync_transcripts(self, since_hours: int = 24) -> List[FirefliesTranscript]:
        """Sync transcripts from the last N hours."""
        
        since_date = datetime.now() - timedelta(hours=since_hours)
        
        # Use last sync time if available and more recent
        if self.last_sync_time and self.last_sync_time > since_date:
            since_date = self.last_sync_time
        
        logger.info(f"Syncing transcripts since {since_date}")
        
        transcripts = await self.client.get_transcripts(since=since_date)
        new_transcripts = []
        
        for transcript in transcripts:
            # Check if already synced
            if transcript.id in self.synced_ids:
                continue
            
            # Process new transcript
            if self.storage_callback:
                await self.storage_callback(transcript)
            
            self.synced_ids.add(transcript.id)
            new_transcripts.append(transcript)
        
        self.last_sync_time = datetime.now()
        logger.info(f"Synced {len(new_transcripts)} new transcripts")
        
        return new_transcripts
    
    async def run_continuous_sync(self, interval_hours: int = 1):
        """Run continuous sync at specified interval."""
        
        while True:
            try:
                await self.sync_transcripts(since_hours=interval_hours * 2)
            except Exception as e:
                logger.error(f"Sync error: {e}")
            
            # Wait for next sync
            await asyncio.sleep(interval_hours * 3600)


# Example usage
async def example_usage():
    """Example of using the Fireflies client."""
    
    settings = FirefliesSettings()
    
    async with FirefliesClient(settings) as client:
        # Get recent transcripts
        transcripts = await client.get_transcripts(
            since=datetime.now() - timedelta(days=7)
        )
        
        for transcript in transcripts:
            print(f"Meeting: {transcript.title}")
            print(f"Date: {transcript.date}")
            print(f"Participants: {', '.join(transcript.participants)}")
            print(f"Duration: {transcript.duration_minutes} minutes")
            print("---")
            
            # Save as markdown
            markdown = transcript.to_markdown()
            filename = transcript.generate_filename()
            print(f"Would save to: {filename}")


if __name__ == "__main__":
    asyncio.run(example_usage())