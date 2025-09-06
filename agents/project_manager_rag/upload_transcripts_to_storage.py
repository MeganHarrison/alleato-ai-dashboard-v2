"""
Upload transcript content to Supabase storage bucket.
Creates markdown files from the transcript data.
"""

import os
import json
import asyncio
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
import logging

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_markdown_from_transcript(transcript_data, metadata):
    """Create a markdown document from transcript data."""
    
    # Extract basic info
    title = metadata.get("title", "Untitled Meeting")
    date = metadata.get("date", "")
    duration = metadata.get("duration_minutes", 0)
    participants = metadata.get("participants", [])
    
    # Start building markdown
    markdown = f"# {title}\n\n"
    markdown += f"**Date:** {date}\n"
    markdown += f"**Duration:** {duration} minutes\n"
    
    if participants:
        markdown += f"**Participants:** {', '.join(participants)}\n"
    
    markdown += "\n---\n\n"
    
    # Add summary if available
    if "summary" in transcript_data:
        summary = transcript_data["summary"]
        
        if summary.get("outline"):
            markdown += "## Summary\n\n"
            markdown += summary["outline"] + "\n\n"
        
        if summary.get("keywords"):
            markdown += "## Topics\n\n"
            for keyword in summary["keywords"]:
                markdown += f"- {keyword}\n"
            markdown += "\n"
        
        if summary.get("action_items"):
            markdown += "## Action Items\n\n"
            markdown += summary["action_items"] + "\n\n"
    
    # Add transcript sentences
    markdown += "## Transcript\n\n"
    
    if "sentences" in transcript_data:
        current_speaker = None
        for sentence in transcript_data["sentences"]:
            speaker_id = sentence.get("speaker_id", 0)
            text = sentence.get("text", "")
            
            # Add speaker label when it changes
            if speaker_id != current_speaker:
                markdown += f"\n**Speaker {speaker_id}:** "
                current_speaker = speaker_id
            
            markdown += f"{text} "
    
    return markdown


async def upload_transcripts_to_supabase():
    """Upload all local transcripts to Supabase storage."""
    
    # Initialize Supabase client
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")
    
    if not url or not key:
        logger.error("Missing Supabase credentials")
        return
    
    supabase = create_client(url, key)
    
    # Use existing meetings bucket
    bucket_name = "meetings"
    logger.info(f"Using existing bucket: {bucket_name}")
    
    # Process each transcript directory
    base_dir = "fireflies_downloads"
    uploaded_count = 0
    failed_count = 0
    
    for folder in os.listdir(base_dir):
        folder_path = os.path.join(base_dir, folder)
        
        if not os.path.isdir(folder_path):
            continue
        
        transcript_file = os.path.join(folder_path, "transcript.json")
        metadata_file = os.path.join(folder_path, "metadata.json")
        
        if not os.path.exists(transcript_file):
            continue
        
        try:
            # Load transcript and metadata
            with open(transcript_file, 'r') as f:
                transcript_data = json.load(f)
            
            metadata = {}
            if os.path.exists(metadata_file):
                with open(metadata_file, 'r') as f:
                    metadata = json.load(f)
            
            # Get meeting ID
            meeting_id = transcript_data.get("id", folder)
            
            # Create markdown content
            markdown_content = create_markdown_from_transcript(transcript_data, metadata)
            
            # Upload to Supabase storage in transcripts subfolder
            file_path = f"transcripts/{meeting_id}.md"
            
            try:
                # Check if file already exists
                existing = supabase.storage.from_(bucket_name).list(path="transcripts")
                file_exists = any(f["name"] == f"{meeting_id}.md" for f in (existing or []))
                
                if file_exists:
                    logger.info(f"File already exists: {file_path}")
                    continue
                
                # Upload the file
                response = supabase.storage.from_(bucket_name).upload(
                    file_path,
                    markdown_content.encode("utf-8"),
                    file_options={"content-type": "text/markdown"}
                )
                
                # Get public URL
                public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
                
                logger.info(f"✅ Uploaded: {folder} -> {public_url}")
                uploaded_count += 1
                
                # Update the meeting record with the transcript URL
                if meeting_id and meeting_id.startswith("01"):  # Valid Fireflies ID
                    try:
                        # Find meeting by fireflies_id
                        meeting_response = supabase.table("meetings").select("id").eq(
                            "fireflies_id", meeting_id
                        ).execute()
                        
                        if meeting_response.data:
                            db_meeting_id = meeting_response.data[0]["id"]
                            
                            # Update with transcript URL
                            supabase.table("meetings").update({
                                "transcript_url": public_url,
                                "storage_bucket_path": file_path
                            }).eq("id", db_meeting_id).execute()
                            
                            logger.info(f"  Updated meeting record with transcript URL")
                    except Exception as e:
                        logger.error(f"  Failed to update meeting record: {e}")
                
            except Exception as e:
                logger.error(f"❌ Failed to upload {folder}: {e}")
                failed_count += 1
                
        except Exception as e:
            logger.error(f"Error processing {folder}: {e}")
            failed_count += 1
    
    logger.info(f"\n{'='*60}")
    logger.info(f"Upload Summary:")
    logger.info(f"  ✅ Uploaded: {uploaded_count}")
    logger.info(f"  ❌ Failed: {failed_count}")
    logger.info(f"{'='*60}")


if __name__ == "__main__":
    asyncio.run(upload_transcripts_to_supabase())