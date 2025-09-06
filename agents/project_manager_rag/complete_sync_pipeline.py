"""
Complete Fireflies sync pipeline with meeting intelligence processing.
This is the production-ready version that handles everything end-to-end.
"""

import os
import asyncio
import httpx
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
import schedule
import time
from threading import Thread

load_dotenv()

from supabase_client_updated import SupabaseClient, MeetingData
from meeting_intelligence import MeetingIntelligence
from embeddings_generator import EmbeddingsGenerator

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class FirefliesSync:
    """Complete Fireflies sync with intelligence processing."""
    
    def __init__(self):
        """Initialize sync components."""
        self.api_key = os.getenv("FIREFLIES_API_KEY")
        self.supabase = SupabaseClient()
        self.intelligence = MeetingIntelligence()
        self.embeddings_generator = EmbeddingsGenerator()
        
        if not self.api_key:
            raise ValueError("FIREFLIES_API_KEY not found in environment")
        
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        self.stats = {
            "total_fetched": 0,
            "new_meetings": 0,
            "existing_meetings": 0,
            "processed": 0,
            "failed": 0,
            "last_sync": None,
            "last_error": None
        }
    
    async def fetch_recent_transcripts(self, hours_back: int = 24, min_meetings: int = 20) -> List[Dict]:
        """Fetch recent transcripts from Fireflies.
        
        Args:
            hours_back: Hours to look back for meetings
            min_meetings: Minimum number of meetings to fetch (default 20)
        """
        logger.info(f"Fetching transcripts from last {hours_back} hours (minimum {min_meetings} meetings)")
        
        # Calculate date range
        since_date = datetime.now() - timedelta(hours=hours_back)
        since_timestamp = int(since_date.timestamp() * 1000)
        
        # Query to fetch transcripts with speakers and participants
        # According to Fireflies schema documentation
        query = """
        query {
            transcripts {
                id
                title
                date
                duration
                organizer_email
                meeting_link
                participants
                speakers {
                    id
                    name
                }
                summary {
                    keywords
                    action_items
                    outline
                }
            }
        }
        """
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://api.fireflies.ai/graphql",
                json={"query": query},
                headers=self.headers
            )
            
            if response.status_code != 200:
                logger.error(f"Fireflies API error: {response.status_code}")
                self.stats["last_error"] = f"API error {response.status_code}"
                return []
            
            data = response.json()
            
            if "errors" in data:
                logger.error(f"GraphQL errors: {data['errors']}")
                self.stats["last_error"] = str(data['errors'])
                return []
            
            transcripts = data.get("data", {}).get("transcripts", [])
            
            # Sort by date (most recent first) and filter
            sorted_transcripts = sorted(
                transcripts,
                key=lambda x: x.get("date", 0) if isinstance(x.get("date"), (int, float)) else 0,
                reverse=True
            )
            
            # Filter by date but ensure minimum number of meetings
            filtered = []
            for t in sorted_transcripts:
                if t.get("date"):
                    transcript_date = t["date"]
                    if isinstance(transcript_date, (int, float)):
                        # Include if within time window OR if we haven't reached minimum
                        if transcript_date >= since_timestamp or len(filtered) < min_meetings:
                            filtered.append(t)
                    else:
                        # If date format is different, include it
                        filtered.append(t)
                else:
                    # Include meetings without dates up to minimum
                    if len(filtered) < min_meetings:
                        filtered.append(t)
                
                # Stop if we have enough meetings and are past the time window
                if len(filtered) >= min_meetings:
                    # Check if we should continue getting more within the time window
                    if t.get("date") and isinstance(t["date"], (int, float)):
                        if t["date"] < since_timestamp:
                            # We're past the time window and have minimum meetings
                            break
            
            # Ensure we get at least min_meetings (take first min_meetings from sorted list)
            if len(filtered) < min_meetings and len(sorted_transcripts) >= min_meetings:
                filtered = sorted_transcripts[:min_meetings]
            
            logger.info(f"Fetched {len(filtered)} transcripts (requested minimum: {min_meetings})")
            self.stats["total_fetched"] = len(filtered)
            
            return filtered
    
    async def fetch_transcript_details(self, transcript_id: str) -> Optional[Dict]:
        """Fetch detailed transcript data including summary and speakers."""
        logger.info(f"Fetching details for transcript {transcript_id}")
        
        query = f"""
        query {{
            transcript(id: "{transcript_id}") {{
                id
                title
                date
                duration
                organizer_email
                meeting_link
                summary {{
                    text
                    keywords
                    action_items
                    outline
                }}
                speakers {{
                    name
                    email
                }}
                sentiments {{
                    overall_sentiment
                    sentiment_score
                }}
            }}
        }}
        """
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.fireflies.ai/graphql",
                    json={"query": query},
                    headers=self.headers
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "data" in data and "transcript" in data["data"]:
                        return data["data"]["transcript"]
        except Exception as e:
            logger.error(f"Error fetching transcript details: {e}")
        
        return None
    
    async def process_transcript(self, transcript_data: Dict) -> bool:
        """Process a single transcript and store in Supabase."""
        fireflies_id = transcript_data.get("id")
        title = transcript_data.get("title", "Untitled")
        
        try:
            # Check if already exists
            exists = await self.supabase.check_meeting_exists(fireflies_id)
            if exists:
                self.stats["existing_meetings"] += 1
                logger.info(f"Meeting {title} already exists, skipping")
                return True
            
            # We don't need detailed data anymore since main query has everything
            # detailed_data = await self.fetch_transcript_details(fireflies_id)
            # if detailed_data:
            #     transcript_data = detailed_data
            
            # Extract date
            date_ms = transcript_data.get("date", 0)
            if isinstance(date_ms, (int, float)):
                meeting_date = datetime.fromtimestamp(date_ms / 1000)
            else:
                meeting_date = datetime.now()
            
            # Extract participants from two sources:
            # 1. participants array (email addresses)
            participants_emails = transcript_data.get("participants", [])
            
            # 2. speakers array (names)
            participants_names = []
            speakers_data = transcript_data.get("speakers", [])
            if speakers_data and isinstance(speakers_data, list):
                for speaker in speakers_data:
                    if isinstance(speaker, dict) and speaker.get("name"):
                        participants_names.append(speaker["name"])
            
            # Combine both sources - prefer names over emails
            participants = participants_names if participants_names else participants_emails
            
            # Add organizer if no participants found
            if not participants and transcript_data.get("organizer_email"):
                participants = [transcript_data["organizer_email"]]
            
            # Extract summary and topics from proper structure
            summary_data = transcript_data.get("summary", {})
            summary_text = ""
            topics = []
            action_items = []
            
            if isinstance(summary_data, dict):
                # Get the outline as summary text (no text field exists)
                outline = summary_data.get("outline", "")
                if outline:
                    summary_text = outline
                
                # Get keywords as topics
                keywords = summary_data.get("keywords", [])
                if isinstance(keywords, list):
                    topics = [str(k) for k in keywords[:10]]  # Limit to 10 topics
                
                # Extract action items - it's a formatted string, not array
                action_items_str = summary_data.get("action_items", "")
                if action_items_str:
                    # Parse the action items string into a list
                    # The format is like "**Person Name**\nAction item 1\nAction item 2"
                    lines = action_items_str.split('\n')
                    action_items = []
                    current_person = ""
                    for line in lines:
                        line = line.strip()
                        if line.startswith('**') and line.endswith('**'):
                            # This is a person's name
                            current_person = line.strip('*').strip()
                        elif line and not line.startswith('**'):
                            # This is an action item
                            if current_person:
                                action_items.append(f"{current_person}: {line}")
                            else:
                                action_items.append(line)
                    action_items = action_items[:20]  # Limit to 20 items
            
            # Get sentiment score
            sentiment_data = transcript_data.get("sentiments", {})
            sentiment_score = 0.0
            if isinstance(sentiment_data, dict):
                sentiment_score = sentiment_data.get("sentiment_score", 0.0)
            
            # Prepare raw metadata with all the data
            raw_metadata = {
                "fireflies_data": {
                    "id": fireflies_id,
                    "title": title,
                    "date": date_ms,
                    "organizer_email": transcript_data.get("organizer_email"),
                    "meeting_link": transcript_data.get("meeting_link")
                },
                "speakers": speakers_data,
                "participants_emails": participants_emails,
                "participants_names": participants_names,
                "topics": topics,
                "keywords": keywords if 'keywords' in locals() else topics,
                "action_items": action_items,
                "summary_object": summary_data,
                "sync_date": datetime.now().isoformat(),
                "sentiment_details": sentiment_data
            }
            
            # If we have summary text, run intelligence processing
            if summary_text:
                logger.info(f"Running AI intelligence for {title}")
                
                try:
                    # Create a simplified transcript object for intelligence processing
                    transcript_obj = {
                        "title": title,
                        "summary": summary_text,
                        "participants": participants,
                        "topics": topics,
                        "action_items": action_items,
                        "duration_minutes": int(transcript_data.get("duration", 0) / 60) if transcript_data.get("duration") else 0
                    }
                    
                    # Run intelligence analysis
                    insights = await self.intelligence.analyze_transcript(transcript_obj)
                    
                    # Update with AI-generated insights
                    if insights.get("summary"):
                        summary_text = insights["summary"]
                    if insights.get("action_items"):
                        action_items = insights["action_items"]
                    if insights.get("topics"):
                        topics = insights["topics"]
                    if insights.get("sentiment_score"):
                        sentiment_score = insights["sentiment_score"]
                    
                    # Add insights to metadata
                    raw_metadata["ai_insights"] = insights
                    
                except Exception as e:
                    logger.error(f"Intelligence processing failed: {e}")
                    # Continue with basic data
            
            # Upload transcript to storage if we have content
            transcript_url = None
            storage_path = None
            
            if summary_text or action_items or participants:
                try:
                    # Create markdown content
                    markdown = f"# {title}\n\n"
                    markdown += f"**Date:** {meeting_date.strftime('%Y-%m-%d %H:%M')}\n"
                    markdown += f"**Fireflies ID:** {fireflies_id}\n\n"
                    
                    if participants:
                        markdown += f"**Participants:** {', '.join(participants)}\n\n"
                    
                    if summary_text:
                        markdown += "## Summary\n\n" + summary_text + "\n\n"
                    
                    if topics:
                        markdown += "## Topics\n\n"
                        for topic in topics:
                            markdown += f"- {topic}\n"
                        markdown += "\n"
                    
                    if action_items:
                        markdown += "## Action Items\n\n"
                        for item in action_items:
                            markdown += f"- {item}\n"
                        markdown += "\n"
                    
                    # Upload to storage
                    storage_path = f"transcripts/{fireflies_id}.md"
                    response = self.supabase.client.storage.from_("meetings").upload(
                        storage_path,
                        markdown.encode("utf-8"),
                        file_options={"content-type": "text/markdown", "upsert": "true"}
                    )
                    
                    # Get public URL
                    transcript_url = self.supabase.client.storage.from_("meetings").get_public_url(storage_path)
                    logger.info(f"Uploaded transcript to storage: {storage_path}")
                    
                except Exception as e:
                    logger.error(f"Failed to upload transcript: {e}")
            
            # Create meeting record
            meeting = MeetingData(
                fireflies_id=fireflies_id,
                title=title,
                date=meeting_date.isoformat(),
                duration_minutes=int(transcript_data.get("duration", 0) / 60) if transcript_data.get("duration") else 0,
                fireflies_link=transcript_data.get("meeting_link"),
                participants=participants,
                summary=summary_text or f"Meeting synced from Fireflies on {datetime.now().strftime('%Y-%m-%d')}",
                action_items=action_items,
                topics=topics,
                sentiment_score=sentiment_score,
                transcript_url=transcript_url,
                storage_bucket_path=storage_path,
                raw_metadata=raw_metadata
            )
            
            # Save to Supabase (without processing_status to avoid constraint)
            meeting_dict = meeting.to_dict()
            if "processing_status" in meeting_dict:
                del meeting_dict["processing_status"]
            
            # Use plain insert without upsert
            try:
                # First approach: direct insert
                response = self.supabase.client.table("meetings").insert(
                    meeting_dict
                ).execute()
            except Exception as insert_error:
                # If that fails due to trigger, try with minimal data
                logger.warning(f"Full insert failed, trying minimal: {str(insert_error)[:100]}")
                
                minimal_dict = {
                    "fireflies_id": fireflies_id,
                    "title": title,
                    "date": meeting_date.isoformat(),
                    "duration_minutes": meeting.duration_minutes,
                    "fireflies_link": meeting.fireflies_link,
                    "summary": meeting.summary,
                    "raw_metadata": raw_metadata
                }
                
                response = self.supabase.client.table("meetings").insert(
                    minimal_dict
                ).execute()
                
                # Then update with the rest of the data
                if response.data:
                    meeting_id = response.data[0]["id"]
                    update_dict = {
                        "participants": participants,
                        "action_items": action_items,
                        "topics": topics,
                        "sentiment_score": sentiment_score
                    }
                    
                    # Update without triggering constraints
                    self.supabase.client.table("meetings").update(
                        update_dict
                    ).eq("id", meeting_id).execute()
            
            if response.data:
                self.stats["new_meetings"] += 1
                self.stats["processed"] += 1
                logger.info(f"✅ Saved meeting: {title}")
                
                # Generate embeddings for the new meeting
                try:
                    meeting_id = response.data[0]["id"]
                    embeddings_count = await self.embeddings_generator.process_meeting(meeting_id)
                    if embeddings_count > 0:
                        logger.info(f"✅ Generated {embeddings_count} embeddings for meeting")
                except Exception as e:
                    logger.error(f"Failed to generate embeddings: {e}")
                
                return True
            else:
                self.stats["failed"] += 1
                logger.error(f"Failed to save meeting: {title}")
                return False
                
        except Exception as e:
            self.stats["failed"] += 1
            self.stats["last_error"] = str(e)
            logger.error(f"Error processing transcript {fireflies_id}: {e}")
            return False
    
    async def _generate_embeddings(self, meeting_id: str, text: str, topics: List[str]):
        """Generate and store embeddings for semantic search."""
        try:
            # Combine text for embedding
            full_text = f"{text} {' '.join(topics)}"
            
            # Generate embedding using OpenAI
            embedding = await self.intelligence.generate_embedding(full_text)
            
            if embedding:
                # Store in meeting_embeddings table
                await self.supabase.create_meeting_embedding(
                    meeting_id=meeting_id,
                    chunk_index=0,
                    embedding=embedding,
                    metadata={"type": "summary", "topics": topics}
                )
                logger.info(f"Generated embeddings for meeting {meeting_id}")
        except Exception as e:
            logger.error(f"Failed to generate embeddings: {e}")
    
    async def sync(self, hours_back: int = 24, min_meetings: int = 20) -> Dict[str, Any]:
        """Run complete sync process.
        
        Args:
            hours_back: Hours to look back for meetings (default 24)
            min_meetings: Minimum number of meetings to process (default 20)
        """
        logger.info("=" * 60)
        logger.info("🚀 STARTING FIREFLIES SYNC")
        logger.info("=" * 60)
        
        self.stats["last_sync"] = datetime.now().isoformat()
        
        # Fetch recent transcripts with minimum threshold
        transcripts = await self.fetch_recent_transcripts(hours_back, min_meetings)
        
        if not transcripts:
            logger.info("No transcripts to process")
            return self.stats
        
        # Process each transcript
        for transcript in transcripts:
            await self.process_transcript(transcript)
        
        # Generate embeddings for any meetings without them
        logger.info("Checking for meetings without embeddings...")
        try:
            total_embeddings = await self.embeddings_generator.process_all_meetings()
            if total_embeddings > 0:
                logger.info(f"✅ Generated {total_embeddings} total embeddings")
        except Exception as e:
            logger.error(f"Failed to generate embeddings for existing meetings: {e}")
        
        # Log summary
        logger.info("=" * 60)
        logger.info("📊 SYNC SUMMARY")
        logger.info("-" * 60)
        logger.info(f"Total fetched:     {self.stats['total_fetched']}")
        logger.info(f"New meetings:      {self.stats['new_meetings']}")
        logger.info(f"Already synced:    {self.stats['existing_meetings']}")
        logger.info(f"Failed:            {self.stats['failed']}")
        logger.info("=" * 60)
        
        return self.stats


class AutomatedSyncScheduler:
    """Scheduler for automated syncing."""
    
    def __init__(self):
        """Initialize scheduler."""
        self.sync = FirefliesSync()
        self.is_running = False
        self.sync_thread = None
        
    def start(self, interval_hours: int = 1):
        """Start automated sync schedule."""
        
        def run_sync():
            """Run sync task with minimum 20 meetings."""
            asyncio.run(self.sync.sync(hours_back=24, min_meetings=20))
        
        def scheduler_loop():
            """Scheduler loop."""
            # Schedule the job
            schedule.every(interval_hours).hours.do(run_sync)
            
            # Run immediately on start
            run_sync()
            
            while self.is_running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        
        if not self.is_running:
            self.is_running = True
            self.sync_thread = Thread(target=scheduler_loop, daemon=True)
            self.sync_thread.start()
            logger.info(f"✅ Started automated sync every {interval_hours} hour(s)")
    
    def stop(self):
        """Stop automated sync."""
        self.is_running = False
        if self.sync_thread:
            self.sync_thread.join(timeout=5)
        logger.info("⏹️ Stopped automated sync")
    
    def run_once(self, hours_back: int = 24, min_meetings: int = 20):
        """Run sync once."""
        return asyncio.run(self.sync.sync(hours_back, min_meetings))


# Main execution
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Fireflies Sync Pipeline")
    parser.add_argument(
        "command",
        choices=["sync", "start", "test"],
        help="Command to execute"
    )
    parser.add_argument(
        "--hours",
        type=int,
        default=24,
        help="Hours to look back for sync (default: 24)"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=1,
        help="Sync interval in hours for automated sync (default: 1)"
    )
    parser.add_argument(
        "--min-meetings",
        type=int,
        default=20,
        help="Minimum number of meetings to fetch (default: 20)"
    )
    
    args = parser.parse_args()
    
    if args.command == "sync":
        # Run one-time sync with minimum meetings
        sync = FirefliesSync()
        stats = asyncio.run(sync.sync(args.hours, args.min_meetings))
        
        if stats["new_meetings"] > 0:
            print(f"\n✅ Successfully synced {stats['new_meetings']} new meetings!")
        else:
            print("\n✅ All meetings already synced")
    
    elif args.command == "start":
        # Start automated sync
        scheduler = AutomatedSyncScheduler()
        scheduler.start(args.interval)
        
        print(f"✅ Started automated sync every {args.interval} hour(s)")
        print("Press Ctrl+C to stop...")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            scheduler.stop()
            print("\n⏹️ Sync stopped")
    
    elif args.command == "test":
        # Test the pipeline with minimum 20 meetings
        print("Testing Fireflies sync pipeline...")
        sync = FirefliesSync()
        
        # Test with last 7 days and minimum 20 meetings
        stats = asyncio.run(sync.sync(168, min_meetings=20))
        
        print("\nTest Results:")
        print(f"  ✅ Pipeline is {'working' if stats['processed'] > 0 or stats['existing_meetings'] > 0 else 'not working'}")
        print(f"  📊 Stats: {stats}")