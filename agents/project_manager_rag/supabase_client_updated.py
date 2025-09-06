"""
Updated Supabase client to work with existing database schema.
Uses meeting_embeddings table for vector storage.
"""

import os
import json
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import logging
import uuid

from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import numpy as np

from fireflies_client import FirefliesTranscript

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class SupabaseSettings(BaseSettings):
    """Supabase configuration settings."""
    
    supabase_url: str = Field(..., description="Supabase project URL")
    supabase_anon_key: Optional[str] = Field(None, description="Supabase anon key")
    supabase_service_key: Optional[str] = Field(None, description="Supabase service key") 
    supabase_key: Optional[str] = Field(None, description="Supabase key (fallback)")
    supabase_bucket: str = Field(
        default="meetings",
        description="Storage bucket for meeting files"
    )
    vector_dimensions: int = Field(
        default=1536,
        description="Embedding vector dimensions"
    )
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore extra fields in .env
    
    def get_supabase_key(self) -> str:
        """Get the appropriate Supabase key."""
        return self.supabase_service_key or self.supabase_anon_key or self.supabase_key or ""


@dataclass
class MeetingData:
    """Meeting data model matching existing schema."""
    
    id: Optional[str] = None
    fireflies_id: Optional[str] = None
    fireflies_link: Optional[str] = None
    title: Optional[str] = None
    date: str = ""
    duration_minutes: Optional[int] = None
    participants: List[str] = field(default_factory=list)
    participant_ids: List[str] = field(default_factory=list)
    project_id: Optional[int] = None
    assignment_confidence: Optional[float] = None
    assignment_signals: Optional[Dict[str, Any]] = None
    summary: Optional[str] = None
    action_items: List[str] = field(default_factory=list)
    decisions: List[str] = field(default_factory=list)
    risks: List[str] = field(default_factory=list)
    topics: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    sentiment_score: Optional[float] = None
    storage_bucket_path: Optional[str] = None
    transcript_url: Optional[str] = None
    recording_url: Optional[str] = None
    raw_metadata: Dict[str, Any] = field(default_factory=dict)
    processing_status: str = "pending"
    processing_version: int = 1
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage."""
        return {
            "fireflies_id": self.fireflies_id,
            "fireflies_link": self.fireflies_link,
            "title": self.title,
            "date": self.date,
            "duration_minutes": self.duration_minutes,
            "participants": self.participants,
            "participant_ids": self.participant_ids,
            "project_id": self.project_id,
            "assignment_confidence": self.assignment_confidence,
            "assignment_signals": self.assignment_signals,
            "summary": self.summary,
            "action_items": self.action_items,
            "decisions": self.decisions,
            "risks": self.risks,
            "topics": self.topics,
            "tags": self.tags,
            "sentiment_score": self.sentiment_score,
            "storage_bucket_path": self.storage_bucket_path,
            "transcript_url": self.transcript_url,
            "recording_url": self.recording_url,
            "raw_metadata": self.raw_metadata,
            "processing_status": self.processing_status,
            "processing_version": self.processing_version
        }


@dataclass
class MeetingEmbedding:
    """Meeting embedding data for vector search."""
    
    id: Optional[str] = None
    meeting_id: str = ""
    chunk_index: int = 0
    embedding: List[float] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage."""
        return {
            "meeting_id": self.meeting_id,
            "chunk_index": self.chunk_index,
            "embedding": json.dumps(self.embedding),  # Store as JSON string
            "metadata": self.metadata
        }


class SupabaseClient:
    """Client for interacting with existing Supabase schema."""
    
    def __init__(self, settings: Optional[SupabaseSettings] = None):
        """Initialize Supabase client."""
        self.settings = settings or SupabaseSettings()
        self.client: Client = create_client(
            self.settings.supabase_url,
            self.settings.get_supabase_key(),
            options=ClientOptions(
                auto_refresh_token=True,
                persist_session=True
            )
        )
    
    # Meeting Management
    
    async def create_meeting(self, meeting: MeetingData) -> MeetingData:
        """Create a new meeting record."""
        try:
            response = self.client.table("meetings").insert(
                meeting.to_dict()
            ).execute()
            
            if response.data:
                meeting.id = response.data[0]["id"]
                meeting.created_at = datetime.fromisoformat(
                    response.data[0]["created_at"]
                ) if response.data[0].get("created_at") else None
            
            return meeting
            
        except Exception as e:
            logger.error(f"Error creating meeting: {e}")
            raise
    
    async def get_meeting(self, meeting_id: str) -> Optional[MeetingData]:
        """Get meeting by ID."""
        try:
            response = self.client.table("meetings").select("*").eq(
                "id", meeting_id
            ).single().execute()
            
            if response.data:
                return self._parse_meeting(response.data)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting meeting: {e}")
            return None
    
    async def check_meeting_exists(self, fireflies_id: str) -> bool:
        """Check if meeting with Fireflies ID already exists."""
        try:
            response = self.client.table("meetings").select("id").eq(
                "fireflies_id", fireflies_id
            ).execute()
            
            return len(response.data) > 0
            
        except Exception as e:
            logger.error(f"Error checking meeting existence: {e}")
            return False
    
    async def update_meeting_processing_status(
        self,
        meeting_id: str,
        status: str,
        error: Optional[str] = None
    ):
        """Update meeting processing status."""
        try:
            update_data = {
                "processing_status": status,
                "processed_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            
            if error:
                update_data["processing_error"] = error
            
            self.client.table("meetings").update(update_data).eq(
                "id", meeting_id
            ).execute()
            
        except Exception as e:
            logger.error(f"Error updating processing status: {e}")
    
    # Meeting Embeddings Management
    
    async def create_meeting_embedding(
        self,
        meeting_id: str,
        chunk_index: int,
        embedding: List[float],
        metadata: Dict[str, Any] = None
    ) -> str:
        """Create a meeting embedding record."""
        try:
            embedding_data = MeetingEmbedding(
                meeting_id=meeting_id,
                chunk_index=chunk_index,
                embedding=embedding,
                metadata=metadata or {}
            )
            
            response = self.client.table("meeting_embeddings").insert(
                embedding_data.to_dict()
            ).execute()
            
            if response.data:
                return response.data[0]["id"]
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating meeting embedding: {e}")
            raise
    
    async def search_meeting_embeddings(
        self,
        query_embedding: List[float],
        project_id: Optional[int] = None,
        limit: int = 10,
        threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search meetings using vector similarity in meeting_embeddings table."""
        try:
            # Convert embedding to string format for RPC call
            embedding_str = json.dumps(query_embedding)
            
            # Use RPC function for vector search
            params = {
                "query_embedding": embedding_str,
                "match_threshold": threshold,
                "match_count": limit
            }
            
            if project_id:
                params["project_filter"] = project_id
            
            response = self.client.rpc(
                "search_meeting_embeddings",
                params
            ).execute()
            
            results = []
            for item in response.data:
                # Get the full meeting data
                meeting = await self.get_meeting(item["meeting_id"])
                if meeting:
                    results.append({
                        "meeting": meeting,
                        "chunk_index": item["chunk_index"],
                        "similarity": item["similarity"],
                        "metadata": item.get("metadata", {})
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching meeting embeddings: {e}")
            return []
    
    # Contact Management (using existing schema)
    
    async def create_or_update_contact(
        self,
        name: str,
        email: Optional[str] = None,
        **kwargs
    ) -> str:
        """Create or update a contact."""
        try:
            # Parse name into first and last
            name_parts = name.split(maxsplit=1)
            first_name = name_parts[0] if name_parts else name
            last_name = name_parts[1] if len(name_parts) > 1 else None
            
            contact_data = {
                "first_name": first_name,
                "last_name": last_name,
                "email": email,
                **kwargs
            }
            
            if email:
                # Check if contact exists
                existing = self.client.table("contacts").select("id").eq(
                    "email", email
                ).execute()
                
                if existing.data:
                    # Update existing
                    response = self.client.table("contacts").update(
                        contact_data
                    ).eq("id", existing.data[0]["id"]).execute()
                    return existing.data[0]["id"]
            
            # Create new contact
            response = self.client.table("contacts").insert(
                contact_data
            ).execute()
            
            if response.data:
                return response.data[0]["id"]
            
            return None
            
        except Exception as e:
            logger.error(f"Error creating/updating contact: {e}")
            return None
    
    # Project Management (using existing schema)
    
    async def find_project_by_keywords(
        self,
        text: str,
        threshold: float = 0.5
    ) -> Optional[Tuple[Dict[str, Any], float]]:
        """Find best matching project based on keywords and aliases."""
        try:
            # Get all active projects
            response = self.client.table("projects").select("*").eq(
                "state", "active"
            ).execute()
            
            projects = response.data or []
            
            best_match = None
            best_score = 0.0
            
            text_lower = text.lower()
            
            for project in projects:
                score = 0.0
                
                # Check project name
                if project.get("name", "").lower() in text_lower:
                    score = 1.0
                
                # Check aliases
                aliases = project.get("aliases", []) or []
                for alias in aliases:
                    if alias.lower() in text_lower:
                        score = max(score, 0.9)
                
                # Check keywords
                keywords = project.get("keywords", []) or []
                if keywords:
                    keyword_matches = sum(
                        1 for kw in keywords
                        if kw.lower() in text_lower
                    )
                    keyword_score = keyword_matches / len(keywords)
                    score = max(score, keyword_score * 0.7)
                
                # Check stakeholders
                stakeholders = project.get("stakeholders", []) or []
                stakeholder_matches = sum(
                    1 for sh in stakeholders
                    if sh.lower() in text_lower
                )
                if stakeholder_matches > 0:
                    score = max(score, 0.5)
                
                if score > best_score and score >= threshold:
                    best_score = score
                    best_match = project
            
            if best_match:
                return (best_match, best_score)
            
            return None
            
        except Exception as e:
            logger.error(f"Error finding project by keywords: {e}")
            return None
    
    # Storage Management
    
    async def upload_transcript(
        self,
        transcript: FirefliesTranscript,
        bucket: Optional[str] = None
    ) -> str:
        """Upload transcript to Supabase storage."""
        try:
            bucket = bucket or self.settings.supabase_bucket
            
            # Generate markdown content
            content = transcript.to_markdown()
            filename = transcript.generate_filename()
            path = f"transcripts/{filename}"
            
            # Upload to storage
            response = self.client.storage.from_(bucket).upload(
                path,
                content.encode("utf-8"),
                file_options={"content-type": "text/markdown"}
            )
            
            # Get public URL
            url = self.client.storage.from_(bucket).get_public_url(path)
            
            return url
            
        except Exception as e:
            logger.error(f"Error uploading transcript: {e}")
            raise
    
    # Helper methods
    
    def _parse_meeting(self, data: Dict[str, Any]) -> MeetingData:
        """Parse meeting from database record."""
        return MeetingData(
            id=data.get("id"),
            fireflies_id=data.get("fireflies_id"),
            fireflies_link=data.get("fireflies_link"),
            title=data.get("title"),
            date=data.get("date", ""),
            duration_minutes=data.get("duration_minutes"),
            participants=data.get("participants", []),
            participant_ids=data.get("participant_ids", []),
            project_id=data.get("project_id"),
            assignment_confidence=data.get("assignment_confidence"),
            assignment_signals=data.get("assignment_signals"),
            summary=data.get("summary"),
            action_items=data.get("action_items", []),
            decisions=data.get("decisions", []),
            risks=data.get("risks", []),
            topics=data.get("topics", []),
            tags=data.get("tags", []),
            sentiment_score=data.get("sentiment_score"),
            storage_bucket_path=data.get("storage_bucket_path"),
            transcript_url=data.get("transcript_url"),
            recording_url=data.get("recording_url"),
            raw_metadata=data.get("raw_metadata", {}),
            processing_status=data.get("processing_status", "pending"),
            processing_version=data.get("processing_version", 1),
            created_at=datetime.fromisoformat(data["created_at"]) 
                if data.get("created_at") else None,
            updated_at=datetime.fromisoformat(data["updated_at"]) 
                if data.get("updated_at") else None
        )