"""
Generate embeddings for meeting content to enable semantic search.
Uses OpenAI's text-embedding-3-small model for vector generation.
"""

import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
from dotenv import load_dotenv
import openai
from openai import AsyncOpenAI
import numpy as np

from supabase_client_updated import SupabaseClient, SupabaseSettings

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmbeddingsGenerator:
    """Generate and store embeddings for meeting content."""
    
    def __init__(self):
        """Initialize embeddings generator with OpenAI client."""
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if not self.openai_api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.client = AsyncOpenAI(api_key=self.openai_api_key)
        self.supabase = SupabaseClient()
        # Use text-embedding-3-small with custom dimensions parameter for 384d
        self.embedding_model = "text-embedding-3-small"
        self.embedding_dimensions = 384  # Match Supabase table requirement
        self.max_chunk_size = 8000  # Max tokens per chunk
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding vector for text using OpenAI."""
        try:
            # OpenAI's text-embedding-3 models support custom dimensions
            response = await self.client.embeddings.create(
                model=self.embedding_model,
                input=text,
                dimensions=self.embedding_dimensions  # Request 384 dimensions
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise
    
    def chunk_text(self, text: str, max_length: int = 8000) -> List[str]:
        """Split text into chunks for embedding."""
        if len(text) <= max_length:
            return [text]
        
        # Split by sentences or paragraphs
        chunks = []
        current_chunk = ""
        
        # Try to split by paragraphs first
        paragraphs = text.split("\n\n")
        
        for para in paragraphs:
            if len(current_chunk) + len(para) + 2 <= max_length:
                current_chunk += para + "\n\n"
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = para + "\n\n"
        
        if current_chunk:
            chunks.append(current_chunk.strip())
        
        return chunks
    
    async def process_meeting(self, meeting_id: str) -> int:
        """Process a single meeting and generate embeddings."""
        try:
            # Get meeting data
            meeting = await self.supabase.get_meeting(meeting_id)
            if not meeting:
                logger.error(f"Meeting {meeting_id} not found")
                return 0
            
            logger.info(f"Processing meeting: {meeting.title}")
            
            # Prepare content for embedding
            content_parts = []
            
            # Add title and date
            content_parts.append(f"Meeting: {meeting.title}")
            content_parts.append(f"Date: {meeting.date}")
            
            # Add participants
            if meeting.participants:
                content_parts.append(f"Participants: {', '.join(meeting.participants)}")
            
            # Add summary
            if meeting.summary:
                content_parts.append(f"Summary: {meeting.summary}")
            
            # Add topics
            if meeting.topics:
                content_parts.append(f"Topics: {', '.join(meeting.topics)}")
            
            # Add action items
            if meeting.action_items:
                content_parts.append("Action Items:")
                for item in meeting.action_items:
                    content_parts.append(f"- {item}")
            
            # Add decisions
            if meeting.decisions:
                content_parts.append("Decisions:")
                for decision in meeting.decisions:
                    content_parts.append(f"- {decision}")
            
            # Add risks
            if meeting.risks:
                content_parts.append("Risks:")
                for risk in meeting.risks:
                    content_parts.append(f"- {risk}")
            
            # Combine all content
            full_content = "\n\n".join(content_parts)
            
            # Generate chunks if needed
            chunks = self.chunk_text(full_content)
            
            embeddings_created = 0
            
            for i, chunk in enumerate(chunks):
                # Generate embedding for chunk
                embedding = await self.generate_embedding(chunk)
                
                # Prepare metadata
                metadata = {
                    "meeting_title": meeting.title,
                    "meeting_date": meeting.date,
                    "chunk_content": chunk[:500],  # First 500 chars for reference
                    "chunk_number": i + 1,
                    "total_chunks": len(chunks),
                    "has_action_items": bool(meeting.action_items),
                    "has_decisions": bool(meeting.decisions),
                    "has_risks": bool(meeting.risks),
                    "participants_count": len(meeting.participants) if meeting.participants else 0
                }
                
                # Store embedding in database
                embedding_id = await self.supabase.create_meeting_embedding(
                    meeting_id=meeting_id,
                    chunk_index=i,
                    embedding=embedding,
                    metadata=metadata
                )
                
                if embedding_id:
                    embeddings_created += 1
                    logger.info(f"  Created embedding chunk {i+1}/{len(chunks)}")
                else:
                    logger.error(f"  Failed to store embedding chunk {i+1}")
            
            return embeddings_created
            
        except Exception as e:
            logger.error(f"Error processing meeting {meeting_id}: {e}")
            return 0
    
    async def process_all_meetings(self):
        """Process all meetings that don't have embeddings yet."""
        try:
            # Get all meetings
            response = self.supabase.client.table("meetings").select("id, title").execute()
            meetings = response.data
            
            logger.info(f"Found {len(meetings)} total meetings")
            
            # Check which meetings already have embeddings
            embeddings_response = self.supabase.client.table("meeting_embeddings").select("meeting_id").execute()
            meetings_with_embeddings = set(e["meeting_id"] for e in embeddings_response.data)
            
            logger.info(f"{len(meetings_with_embeddings)} meetings already have embeddings")
            
            # Process meetings without embeddings
            meetings_to_process = [m for m in meetings if m["id"] not in meetings_with_embeddings]
            
            logger.info(f"Processing {len(meetings_to_process)} meetings without embeddings")
            
            total_embeddings = 0
            
            for meeting in meetings_to_process:
                embeddings_count = await self.process_meeting(meeting["id"])
                total_embeddings += embeddings_count
                logger.info(f"✅ Processed {meeting['title']}: {embeddings_count} embeddings created")
            
            logger.info(f"\n{'='*60}")
            logger.info(f"Embedding Generation Complete:")
            logger.info(f"  Total meetings processed: {len(meetings_to_process)}")
            logger.info(f"  Total embeddings created: {total_embeddings}")
            logger.info(f"{'='*60}")
            
            return total_embeddings
            
        except Exception as e:
            logger.error(f"Error processing meetings: {e}")
            raise
    
    async def update_existing_meeting_embeddings(self, meeting_id: str):
        """Update embeddings for a specific meeting (useful after meeting updates)."""
        try:
            # Delete existing embeddings
            self.supabase.client.table("meeting_embeddings").delete().eq(
                "meeting_id", meeting_id
            ).execute()
            
            logger.info(f"Deleted existing embeddings for meeting {meeting_id}")
            
            # Generate new embeddings
            embeddings_count = await self.process_meeting(meeting_id)
            
            logger.info(f"Created {embeddings_count} new embeddings for meeting {meeting_id}")
            
            return embeddings_count
            
        except Exception as e:
            logger.error(f"Error updating embeddings for meeting {meeting_id}: {e}")
            raise


async def main():
    """Generate embeddings for all meetings."""
    generator = EmbeddingsGenerator()
    await generator.process_all_meetings()


if __name__ == "__main__":
    asyncio.run(main())