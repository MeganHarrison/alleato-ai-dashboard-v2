#!/usr/bin/env node

/**
 * Enhanced Fireflies Sync Script V2
 * 
 * This enhanced version extracts MUCH more data from Fireflies including:
 * - Complete speaker analytics (talk time, interruptions, questions)
 * - Sentiment analysis at meeting and speaker level
 * - Structured action items with assignees and due dates
 * - Decisions and commitments extraction
 * - Meeting quality metrics and effectiveness scores
 * - Competitive intelligence
 * - Key moments and highlights
 * 
 * Usage:
 *   npm run sync:fireflies-v2
 *   node scripts/enhanced-fireflies-sync-v2.js --limit=50 --dry-run=false
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  if (key && value) {
    acc[key.replace('--', '')] = value;
  }
  return acc;
}, {});

// Load environment variables from .env.local first
config({ path: path.join(__dirname, '../.env.local') });

// Configuration with fallback order: CLI args > ENV vars > .env.local
const SUPABASE_URL = args['supabase-url'] || 
                     process.env.SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL;

const SUPABASE_SERVICE_KEY = args['supabase-key'] || 
                              process.env.SUPABASE_SERVICE_ROLE_KEY || 
                              process.env.SUPABASE_SERVICE_KEY;

const FIREFLIES_API_KEY = args['fireflies-key'] || 
                           process.env.FIREFLIES_API_KEY;

// Sync options from CLI
const SYNC_LIMIT = parseInt(args['limit'] || '50');
const DRY_RUN = args['dry-run'] === 'true';
const VERBOSE = args['verbose'] === 'true';

// Display configuration (mask sensitive data)
console.log('🔧 Enhanced Fireflies Sync V2 Configuration:');
console.log(`   Supabase URL: ${SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET'}`);
console.log(`   Supabase Key: ${SUPABASE_SERVICE_KEY ? '***' + SUPABASE_SERVICE_KEY.slice(-4) : 'NOT SET'}`);
console.log(`   Fireflies Key: ${FIREFLIES_API_KEY ? '***' + FIREFLIES_API_KEY.slice(-4) : 'NOT SET'}`);
console.log(`   Sync Limit: ${SYNC_LIMIT}`);
console.log(`   Dry Run: ${DRY_RUN}`);
console.log(`   Verbose: ${VERBOSE}`);
console.log('');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !FIREFLIES_API_KEY) {
  console.error('❌ Missing required environment variables\n');
  console.log('Please provide the following:');
  console.log('  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, FIREFLIES_API_KEY\n');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Enhanced Fireflies GraphQL client with V2 features
 */
class FirefliesClientV2 {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.fireflies.ai/graphql';
  }

  async graphqlRequest(query, variables = {}) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`Fireflies API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async getTranscripts(limit = 50) {
    const query = `
      query GetTranscripts($limit: Int) {
        transcripts(limit: $limit) {
          title
          id
          transcript_url
          audio_url
          video_url
          duration
          date
          participants
          meeting_attendees {
            displayName
            email
            name
          }
          host_email
          organizer_email
        }
      }
    `;

    const data = await this.graphqlRequest(query, { limit });
    return data.transcripts;
  }

  /**
   * Get ENHANCED transcript details with all available fields
   */
  async getEnhancedTranscriptDetails(transcriptId) {
    const query = `
      query GetEnhancedTranscript($id: String!) {
        transcript(id: $id) {
          # Basic fields
          title
          id
          transcript_url
          audio_url
          video_url
          duration
          date
          participants
          host_email
          organizer_email
          
          # Meeting attendees with full details
          meeting_attendees {
            displayName
            email
            name
          }
          
          # User context
          user {
            name
            email
          }
          
          # Enhanced analytics
          analytics {
            # Sentiment analysis
            sentiments {
              negative_pct
              neutral_pct
              positive_pct
            }
            
            # Speaker analytics
            speakers {
              speaker_id
              name
              email
              duration
              duration_pct
              word_count
              words_per_minute
              longest_monologue
              monologues_count
              filler_words
              questions
              interruptions
              talk_listen_ratio
            }
            
            # Questions analysis
            questions {
              count
              by_speaker {
                speaker_id
                count
              }
            }
            
            # Task analysis
            tasks {
              count
              with_assignees
              with_due_dates
            }
            
            # Date/time mentions
            date_times {
              count
            }
            
            # Metrics mentioned
            metrics {
              count
            }
            
            # Silence analysis
            silence_duration
            
            # Meeting quality
            interruption_count
          }
          
          # Enhanced sentences with ALL AI filters
          sentences {
            index
            text
            raw_text
            start_time
            end_time
            speaker_id
            speaker_name
            
            # Complete AI filters
            ai_filters {
              sentiment
              task
              pricing
              metric
              question
              date_and_time
            }
          }
          
          # Enhanced summary with structured data
          summary {
            action_items
            keywords
            outline
            overview
            notes
            shorthand_bullet
          }
          
          # Topics with timestamps
          topics {
            text
            start_time
            end_time
          }
          
          # Soundbites (key moments)
          soundbites {
            id
            title
            start_time
            end_time
            video_url
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, { id: transcriptId });
    return data.transcript;
  }

  /**
   * Extract ENHANCED metadata with V2 features
   */
  extractEnhancedMetadataV2(transcript) {
    const metadata = {
      // Basic fields
      fireflies_id: transcript.id,
      title: transcript.title,
      date: new Date(transcript.date).toISOString(),
      duration_minutes: Math.round((transcript.duration || 0) / 60),
      participants: transcript.participants || [],
      transcript_url: transcript.transcript_url,
      audio_url: transcript.audio_url,
      video_url: transcript.video_url,
      organizer_email: transcript.organizer_email,
      host_email: transcript.host_email,
      
      // Enhanced attendee information
      meeting_attendees: transcript.meeting_attendees || [],
      
      // SENTIMENT ANALYSIS
      sentiment_analysis: this.extractSentimentAnalysis(transcript),
      
      // SPEAKER ANALYTICS
      speaker_analytics: this.extractSpeakerAnalytics(transcript),
      
      // CONVERSATION QUALITY
      conversation_quality: this.extractConversationQuality(transcript),
      
      // STRUCTURED ACTION ITEMS
      structured_action_items: this.extractStructuredActionItems(transcript),
      
      // DECISIONS & COMMITMENTS
      decisions_made: this.extractDecisions(transcript),
      commitments_given: this.extractCommitments(transcript),
      
      // QUESTIONS ANALYSIS
      questions_analysis: this.extractQuestionsAnalysis(transcript),
      
      // KEY MOMENTS
      key_moments: this.extractKeyMoments(transcript),
      
      // COMPETITIVE INTELLIGENCE
      competitive_insights: this.extractCompetitiveInsights(transcript),
      
      // MEETING EFFECTIVENESS
      meeting_effectiveness: this.calculateMeetingEffectiveness(transcript),
      
      // Topics with enhanced data
      topics: transcript.topics || [],
      
      // Summary fields
      summary: transcript.summary?.overview || null,
      action_items: transcript.summary?.action_items || [],
      keywords: transcript.summary?.keywords || [],
      outline: transcript.summary?.outline || null,
      notes: transcript.summary?.notes || null,
      bullet_points: transcript.summary?.shorthand_bullet || [],
      
      // Statistics
      total_words: this.calculateTotalWords(transcript),
      speaker_count: transcript.analytics?.speakers?.length || 0,
      question_count: transcript.analytics?.questions?.count || 0,
      task_count: transcript.analytics?.tasks?.count || 0,
      silence_percentage: this.calculateSilencePercentage(transcript),
      
      // Meeting type detection
      meeting_type: this.detectMeetingType(transcript),
      has_action_items: (transcript.summary?.action_items?.length || 0) > 0,
      has_video: !!transcript.video_url,
      
      // Timestamps
      synced_at: new Date().toISOString(),
    };

    return metadata;
  }

  /**
   * Extract sentiment analysis from transcript
   */
  extractSentimentAnalysis(transcript) {
    const sentiments = transcript.analytics?.sentiments || {};
    
    // Calculate dominant sentiment
    let dominant = 'neutral';
    if (sentiments.positive_pct > sentiments.negative_pct && sentiments.positive_pct > sentiments.neutral_pct) {
      dominant = 'positive';
    } else if (sentiments.negative_pct > sentiments.positive_pct && sentiments.negative_pct > sentiments.neutral_pct) {
      dominant = 'negative';
    }
    
    // Extract sentiment timeline from sentences
    const sentimentTimeline = [];
    if (transcript.sentences) {
      const segments = this.createTimeSegments(transcript.sentences, 300); // 5-minute segments
      segments.forEach(segment => {
        const segmentSentiments = segment.sentences
          .map(s => s.ai_filters?.sentiment)
          .filter(Boolean);
        
        if (segmentSentiments.length > 0) {
          const counts = {
            positive: segmentSentiments.filter(s => s === 'positive').length,
            neutral: segmentSentiments.filter(s => s === 'neutral').length,
            negative: segmentSentiments.filter(s => s === 'negative').length,
          };
          
          const dominantSegmentSentiment = Object.keys(counts).reduce((a, b) => 
            counts[a] > counts[b] ? a : b
          );
          
          sentimentTimeline.push({
            start_time: segment.start_time,
            end_time: segment.end_time,
            sentiment: dominantSegmentSentiment,
            confidence: counts[dominantSegmentSentiment] / segmentSentiments.length,
          });
        }
      });
    }
    
    return {
      overall: sentiments,
      dominant_sentiment: dominant,
      sentiment_timeline: sentimentTimeline,
      emotional_volatility: this.calculateEmotionalVolatility(sentimentTimeline),
    };
  }

  /**
   * Extract detailed speaker analytics
   */
  extractSpeakerAnalytics(transcript) {
    const speakers = transcript.analytics?.speakers || [];
    
    return speakers.map(speaker => ({
      speaker_id: speaker.speaker_id,
      name: speaker.name || speaker.speaker_id,
      email: speaker.email,
      duration_seconds: speaker.duration || 0,
      duration_percentage: speaker.duration_pct || 0,
      word_count: speaker.word_count || 0,
      words_per_minute: speaker.words_per_minute || 0,
      longest_monologue_seconds: speaker.longest_monologue || 0,
      monologues_count: speaker.monologues_count || 0,
      filler_words_count: speaker.filler_words || 0,
      questions_asked: speaker.questions || 0,
      interruptions_made: speaker.interruptions || 0,
      talk_listen_ratio: speaker.talk_listen_ratio || 0,
      
      // Calculate engagement score
      engagement_score: this.calculateSpeakerEngagement(speaker),
      
      // Communication style analysis
      communication_style: this.analyzeCommunicationStyle(speaker),
      
      // Speaking patterns
      speaking_patterns: {
        is_dominant_speaker: speaker.duration_pct > 40,
        is_active_questioner: speaker.questions > 5,
        is_frequent_interrupter: speaker.interruptions > 3,
        uses_many_filler_words: speaker.filler_words > 10,
      },
    }));
  }

  /**
   * Extract conversation quality metrics
   */
  extractConversationQuality(transcript) {
    const analytics = transcript.analytics || {};
    const speakers = analytics.speakers || [];
    
    // Calculate participation balance (0-1, where 1 is perfectly balanced)
    const participationBalance = this.calculateParticipationBalance(speakers);
    
    // Calculate interruption rate
    const totalInterruptions = speakers.reduce((sum, s) => sum + (s.interruptions || 0), 0);
    const interruptionRate = transcript.duration ? (totalInterruptions / (transcript.duration / 60)) : 0;
    
    // Calculate silence percentage
    const silencePercentage = analytics.silence_duration ? 
      (analytics.silence_duration / transcript.duration) * 100 : 0;
    
    // Meeting efficiency score
    const hasActionItems = (transcript.summary?.action_items?.length || 0) > 0;
    const hasDecisions = this.extractDecisions(transcript).length > 0;
    const efficiencyScore = this.calculateEfficiencyScore(hasActionItems, hasDecisions, participationBalance);
    
    return {
      participation_balance: participationBalance,
      interruption_rate: interruptionRate,
      total_interruptions: totalInterruptions,
      silence_percentage: silencePercentage,
      silence_duration_seconds: analytics.silence_duration || 0,
      meeting_efficiency_score: efficiencyScore,
      engagement_level: this.calculateOverallEngagement(speakers),
      
      // Quality indicators
      quality_indicators: {
        balanced_participation: participationBalance > 0.7,
        minimal_interruptions: interruptionRate < 2,
        productive_silence: silencePercentage < 10 && silencePercentage > 2,
        clear_outcomes: hasActionItems || hasDecisions,
      },
    };
  }

  /**
   * Extract structured action items with assignees and due dates
   */
  extractStructuredActionItems(transcript) {
    if (!transcript.sentences) return [];
    
    const actionItems = [];
    const taskSentences = transcript.sentences.filter(s => s.ai_filters?.task);
    
    taskSentences.forEach((sentence, index) => {
      // Try to find assignee in surrounding context
      const assignee = this.findAssigneeInContext(transcript.sentences, sentence.index);
      const dueDate = this.findDueDateInContext(transcript.sentences, sentence.index);
      const priority = this.determinePriority(sentence);
      
      actionItems.push({
        id: `action_${sentence.index}`,
        text: sentence.ai_filters.task,
        assignee: assignee,
        due_date: dueDate,
        priority: priority,
        category: this.categorizeActionItem(sentence.ai_filters.task),
        timestamp_seconds: sentence.start_time,
        speaker_who_mentioned: sentence.speaker_name || sentence.speaker_id,
        context: sentence.text,
        confidence_score: 0.85, // Default confidence
      });
    });
    
    return actionItems;
  }

  /**
   * Extract decisions from transcript
   */
  extractDecisions(transcript) {
    if (!transcript.sentences) return [];
    
    const decisionKeywords = [
      'we decided', 'we will', "we'll", 'decision is', 'agreed to', 
      'going with', 'chosen', 'selected', 'confirmed', 'approved',
      'final decision', 'we are going', 'plan is to'
    ];
    
    return transcript.sentences
      .filter(sentence => {
        const text = sentence.text?.toLowerCase() || '';
        return decisionKeywords.some(keyword => text.includes(keyword));
      })
      .map(sentence => ({
        text: sentence.text,
        timestamp_seconds: sentence.start_time,
        speaker: sentence.speaker_name || sentence.speaker_id,
        confidence: this.calculateDecisionConfidence(sentence.text),
      }));
  }

  /**
   * Extract commitments from transcript
   */
  extractCommitments(transcript) {
    if (!transcript.sentences) return [];
    
    const commitmentKeywords = [
      'i will', "i'll", 'i commit', 'i promise', 'i can', 
      'i am going to', 'i will take care', 'on me', 'my responsibility',
      'i will handle', 'i will make sure'
    ];
    
    return transcript.sentences
      .filter(sentence => {
        const text = sentence.text?.toLowerCase() || '';
        return commitmentKeywords.some(keyword => text.includes(keyword));
      })
      .map(sentence => ({
        text: sentence.text,
        person: sentence.speaker_name || sentence.speaker_id,
        timestamp_seconds: sentence.start_time,
        reliability_score: 0.8, // Default reliability
      }));
  }

  /**
   * Extract questions analysis
   */
  extractQuestionsAnalysis(transcript) {
    const questions = transcript.analytics?.questions || {};
    const questionSentences = transcript.sentences?.filter(s => s.ai_filters?.question) || [];
    
    // Categorize questions
    const categorizedQuestions = questionSentences.map(sentence => ({
      text: sentence.ai_filters.question || sentence.text,
      speaker: sentence.speaker_name || sentence.speaker_id,
      timestamp: sentence.start_time,
      type: this.categorizeQuestion(sentence.text),
      answered: this.checkIfAnswered(transcript.sentences, sentence.index),
    }));
    
    return {
      total_count: questions.count || questionSentences.length,
      by_speaker: questions.by_speaker || [],
      categorized: categorizedQuestions,
      unanswered_count: categorizedQuestions.filter(q => !q.answered).length,
    };
  }

  /**
   * Extract key moments and highlights
   */
  extractKeyMoments(transcript) {
    const keyMoments = [];
    
    // Add soundbites as key moments
    if (transcript.soundbites) {
      transcript.soundbites.forEach(soundbite => {
        keyMoments.push({
          type: 'highlight',
          title: soundbite.title,
          timestamp_start: soundbite.start_time,
          timestamp_end: soundbite.end_time,
          video_url: soundbite.video_url,
          importance: 'high',
        });
      });
    }
    
    // Add decisions as key moments
    const decisions = this.extractDecisions(transcript);
    decisions.forEach(decision => {
      keyMoments.push({
        type: 'decision',
        title: 'Decision Made',
        description: decision.text.substring(0, 100),
        timestamp_start: decision.timestamp_seconds,
        speaker: decision.speaker,
        importance: 'high',
      });
    });
    
    // Add high-priority action items
    const actionItems = this.extractStructuredActionItems(transcript);
    actionItems
      .filter(item => item.priority === 'high' || item.priority === 'urgent')
      .forEach(item => {
        keyMoments.push({
          type: 'action_item',
          title: 'High Priority Action',
          description: item.text,
          timestamp_start: item.timestamp_seconds,
          assignee: item.assignee,
          importance: 'high',
        });
      });
    
    // Sort by timestamp
    return keyMoments.sort((a, b) => (a.timestamp_start || 0) - (b.timestamp_start || 0));
  }

  /**
   * Extract competitive intelligence
   */
  extractCompetitiveInsights(transcript) {
    const competitors = [
      'salesforce', 'hubspot', 'microsoft', 'google', 'amazon', 'aws',
      'competitor', 'competition', 'alternative', 'versus', 'compared to'
    ];
    
    const competitorMentions = [];
    const pricingDiscussions = [];
    
    if (transcript.sentences) {
      transcript.sentences.forEach(sentence => {
        const text = sentence.text?.toLowerCase() || '';
        
        // Check for competitor mentions
        competitors.forEach(competitor => {
          if (text.includes(competitor)) {
            competitorMentions.push({
              competitor: competitor,
              context: sentence.text,
              timestamp: sentence.start_time,
              speaker: sentence.speaker_name || sentence.speaker_id,
              sentiment: sentence.ai_filters?.sentiment,
            });
          }
        });
        
        // Check for pricing discussions
        if (sentence.ai_filters?.pricing) {
          pricingDiscussions.push({
            amount: sentence.ai_filters.pricing,
            context: sentence.text,
            timestamp: sentence.start_time,
            speaker: sentence.speaker_name || sentence.speaker_id,
          });
        }
      });
    }
    
    return {
      competitor_mentions: competitorMentions,
      pricing_discussions: pricingDiscussions,
      competitive_advantage_mentioned: competitorMentions.some(m => 
        m.context.toLowerCase().includes('better') || 
        m.context.toLowerCase().includes('advantage')
      ),
    };
  }

  /**
   * Calculate meeting effectiveness score
   */
  calculateMeetingEffectiveness(transcript) {
    const factors = {
      has_clear_agenda: transcript.topics?.length > 0,
      has_action_items: (transcript.summary?.action_items?.length || 0) > 0,
      has_decisions: this.extractDecisions(transcript).length > 0,
      balanced_participation: this.calculateParticipationBalance(transcript.analytics?.speakers || []) > 0.6,
      appropriate_duration: transcript.duration > 600 && transcript.duration < 3600, // 10-60 minutes
      positive_sentiment: (transcript.analytics?.sentiments?.positive_pct || 0) > 30,
    };
    
    const score = Object.values(factors).filter(Boolean).length / Object.keys(factors).length;
    
    return {
      overall_score: Math.round(score * 100),
      factors: factors,
      recommendations: this.generateMeetingRecommendations(factors),
    };
  }

  // === HELPER METHODS ===

  calculateTotalWords(transcript) {
    if (!transcript.sentences) return 0;
    return transcript.sentences.reduce((total, sentence) => {
      const words = sentence.text?.split(/\s+/).length || 0;
      return total + words;
    }, 0);
  }

  calculateSilencePercentage(transcript) {
    if (!transcript.duration || !transcript.analytics?.silence_duration) return 0;
    return Math.round((transcript.analytics.silence_duration / transcript.duration) * 100);
  }

  detectMeetingType(transcript) {
    const title = transcript.title?.toLowerCase() || '';
    
    if (title.includes('daily') || title.includes('standup')) return 'daily_standup';
    if (title.includes('weekly') || title.includes('week')) return 'weekly_sync';
    if (title.includes('planning') || title.includes('sprint')) return 'planning';
    if (title.includes('retro') || title.includes('retrospective')) return 'retrospective';
    if (title.includes('1:1') || title.includes('one-on-one')) return 'one_on_one';
    if (title.includes('interview')) return 'interview';
    if (title.includes('demo') || title.includes('presentation')) return 'demo';
    if (title.includes('review')) return 'review';
    if (title.includes('client') || title.includes('customer')) return 'client_meeting';
    if (title.includes('sales') || title.includes('pitch')) return 'sales_meeting';
    if (title.includes('all hands') || title.includes('town hall')) return 'all_hands';
    
    return 'general';
  }

  createTimeSegments(sentences, segmentDurationSeconds) {
    const segments = [];
    if (!sentences || sentences.length === 0) return segments;
    
    let currentSegment = {
      start_time: 0,
      end_time: segmentDurationSeconds,
      sentences: [],
    };
    
    sentences.forEach(sentence => {
      if (sentence.start_time < currentSegment.end_time) {
        currentSegment.sentences.push(sentence);
      } else {
        if (currentSegment.sentences.length > 0) {
          segments.push(currentSegment);
        }
        currentSegment = {
          start_time: currentSegment.end_time,
          end_time: currentSegment.end_time + segmentDurationSeconds,
          sentences: [sentence],
        };
      }
    });
    
    if (currentSegment.sentences.length > 0) {
      segments.push(currentSegment);
    }
    
    return segments;
  }

  calculateEmotionalVolatility(timeline) {
    if (!timeline || timeline.length < 2) return 0;
    
    let changes = 0;
    for (let i = 1; i < timeline.length; i++) {
      if (timeline[i].sentiment !== timeline[i - 1].sentiment) {
        changes++;
      }
    }
    
    return changes / (timeline.length - 1);
  }

  calculateParticipationBalance(speakers) {
    if (!speakers || speakers.length === 0) return 0;
    
    const totalDuration = speakers.reduce((sum, s) => sum + (s.duration || 0), 0);
    if (totalDuration === 0) return 0;
    
    const idealShare = 1 / speakers.length;
    const deviations = speakers.map(s => 
      Math.abs((s.duration / totalDuration) - idealShare)
    );
    
    const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
    return Math.max(0, 1 - (avgDeviation * speakers.length));
  }

  calculateSpeakerEngagement(speaker) {
    const factors = [
      speaker.words_per_minute > 100 && speaker.words_per_minute < 180 ? 1 : 0.5,
      speaker.questions > 0 ? 1 : 0.3,
      speaker.filler_words < 10 ? 1 : 0.5,
      speaker.talk_listen_ratio > 0.5 && speaker.talk_listen_ratio < 2 ? 1 : 0.5,
    ];
    
    return factors.reduce((sum, f) => sum + f, 0) / factors.length;
  }

  analyzeCommunicationStyle(speaker) {
    if (speaker.talk_listen_ratio > 2) return 'dominant';
    if (speaker.questions > 5) return 'inquisitive';
    if (speaker.talk_listen_ratio < 0.5) return 'listener';
    if (speaker.monologues_count > 3) return 'presenter';
    return 'balanced';
  }

  calculateEfficiencyScore(hasActionItems, hasDecisions, participationBalance) {
    let score = 0;
    if (hasActionItems) score += 0.4;
    if (hasDecisions) score += 0.3;
    score += participationBalance * 0.3;
    return Math.round(score * 100);
  }

  calculateOverallEngagement(speakers) {
    if (!speakers || speakers.length === 0) return 'low';
    
    const avgQuestions = speakers.reduce((sum, s) => sum + (s.questions || 0), 0) / speakers.length;
    const avgWPM = speakers.reduce((sum, s) => sum + (s.words_per_minute || 0), 0) / speakers.length;
    
    if (avgQuestions > 3 && avgWPM > 120) return 'high';
    if (avgQuestions > 1 || avgWPM > 100) return 'medium';
    return 'low';
  }

  findAssigneeInContext(sentences, currentIndex) {
    // Look in surrounding sentences for assignee mentions
    const window = 3;
    const start = Math.max(0, currentIndex - window);
    const end = Math.min(sentences.length, currentIndex + window);
    
    for (let i = start; i < end; i++) {
      const text = sentences[i].text?.toLowerCase() || '';
      // Look for patterns like "John will", "Sarah can you", etc.
      const namePattern = /(\w+),?\s+(will|can|should|could|would|please)\s+/i;
      const match = text.match(namePattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  findDueDateInContext(sentences, currentIndex) {
    // Look for date mentions in surrounding sentences
    const window = 3;
    const start = Math.max(0, currentIndex - window);
    const end = Math.min(sentences.length, currentIndex + window);
    
    for (let i = start; i < end; i++) {
      if (sentences[i].ai_filters?.date_and_time) {
        return sentences[i].ai_filters.date_and_time;
      }
    }
    
    return null;
  }

  determinePriority(sentence) {
    const text = sentence.text?.toLowerCase() || '';
    if (text.includes('urgent') || text.includes('asap') || text.includes('immediately')) return 'urgent';
    if (text.includes('important') || text.includes('priority') || text.includes('critical')) return 'high';
    if (text.includes('when you can') || text.includes('nice to have')) return 'low';
    return 'medium';
  }

  categorizeActionItem(task) {
    const taskLower = task?.toLowerCase() || '';
    if (taskLower.includes('review') || taskLower.includes('check')) return 'review';
    if (taskLower.includes('create') || taskLower.includes('build')) return 'creation';
    if (taskLower.includes('update') || taskLower.includes('modify')) return 'update';
    if (taskLower.includes('send') || taskLower.includes('email')) return 'communication';
    if (taskLower.includes('meet') || taskLower.includes('schedule')) return 'meeting';
    if (taskLower.includes('research') || taskLower.includes('investigate')) return 'research';
    return 'general';
  }

  calculateDecisionConfidence(text) {
    const strongIndicators = ['definitely', 'absolutely', 'confirmed', 'final', 'agreed'];
    const weakIndicators = ['maybe', 'probably', 'think', 'might', 'could'];
    
    const textLower = text?.toLowerCase() || '';
    
    if (strongIndicators.some(word => textLower.includes(word))) return 0.9;
    if (weakIndicators.some(word => textLower.includes(word))) return 0.5;
    return 0.7;
  }

  categorizeQuestion(text) {
    const textLower = text?.toLowerCase() || '';
    if (textLower.includes('why') || textLower.includes('reason')) return 'why';
    if (textLower.includes('how') || textLower.includes('way')) return 'how';
    if (textLower.includes('what') || textLower.includes('which')) return 'what';
    if (textLower.includes('when') || textLower.includes('time')) return 'when';
    if (textLower.includes('who') || textLower.includes('whom')) return 'who';
    if (textLower.includes('where') || textLower.includes('location')) return 'where';
    if (textLower.startsWith('is') || textLower.startsWith('are') || textLower.startsWith('can')) return 'yes_no';
    return 'general';
  }

  checkIfAnswered(sentences, questionIndex) {
    // Check next 3-5 sentences for potential answer
    const checkRange = 5;
    const end = Math.min(sentences.length, questionIndex + checkRange);
    
    for (let i = questionIndex + 1; i < end; i++) {
      const text = sentences[i].text?.toLowerCase() || '';
      // Simple heuristic: if someone else speaks after the question, assume it's answered
      if (sentences[i].speaker_id !== sentences[questionIndex].speaker_id) {
        return true;
      }
    }
    
    return false;
  }

  generateMeetingRecommendations(factors) {
    const recommendations = [];
    
    if (!factors.has_clear_agenda) {
      recommendations.push('Consider creating a clear agenda with topics before the meeting');
    }
    if (!factors.has_action_items) {
      recommendations.push('Ensure action items are clearly defined and assigned');
    }
    if (!factors.has_decisions) {
      recommendations.push('Document decisions made during the meeting');
    }
    if (!factors.balanced_participation) {
      recommendations.push('Encourage more balanced participation from all attendees');
    }
    if (!factors.appropriate_duration) {
      recommendations.push('Consider adjusting meeting duration for optimal productivity');
    }
    
    return recommendations;
  }

  /**
   * Format enhanced markdown with V2 features
   */
  formatEnhancedMarkdownV2(transcript, metadata) {
    let markdown = `# ${transcript.title}\n\n`;
    
    // Meeting info with enhanced data
    markdown += `## Meeting Information\n\n`;
    markdown += `- **Date:** ${new Date(transcript.date).toLocaleString()}\n`;
    markdown += `- **Duration:** ${Math.round((transcript.duration || 0) / 60)} minutes\n`;
    markdown += `- **Participants:** ${transcript.participants?.join(', ') || 'N/A'}\n`;
    markdown += `- **Meeting Type:** ${metadata.meeting_type}\n`;
    markdown += `- **Has Video:** ${metadata.has_video ? 'Yes' : 'No'}\n`;
    
    if (transcript.meeting_attendees?.length > 0) {
      markdown += `\n### Attendees\n`;
      transcript.meeting_attendees.forEach(attendee => {
        markdown += `- ${attendee.displayName || attendee.name} (${attendee.email || 'No email'})\n`;
      });
    }
    
    // Meeting effectiveness
    markdown += `\n## Meeting Effectiveness\n\n`;
    markdown += `- **Overall Score:** ${metadata.meeting_effectiveness.overall_score}/100\n`;
    markdown += `- **Recommendations:**\n`;
    metadata.meeting_effectiveness.recommendations.forEach(rec => {
      markdown += `  - ${rec}\n`;
    });
    
    // Sentiment analysis
    markdown += `\n## Sentiment Analysis\n\n`;
    const sentiment = metadata.sentiment_analysis;
    markdown += `- **Overall:** ${sentiment.dominant_sentiment}\n`;
    markdown += `  - Positive: ${sentiment.overall.positive_pct?.toFixed(1)}%\n`;
    markdown += `  - Neutral: ${sentiment.overall.neutral_pct?.toFixed(1)}%\n`;
    markdown += `  - Negative: ${sentiment.overall.negative_pct?.toFixed(1)}%\n`;
    
    // Speaker analytics
    if (metadata.speaker_analytics?.length > 0) {
      markdown += `\n## Speaker Analytics\n\n`;
      metadata.speaker_analytics.forEach(speaker => {
        markdown += `### ${speaker.name}\n`;
        markdown += `- Talk time: ${speaker.duration_percentage.toFixed(1)}%\n`;
        markdown += `- Words per minute: ${speaker.words_per_minute}\n`;
        markdown += `- Questions asked: ${speaker.questions_asked}\n`;
        markdown += `- Communication style: ${speaker.communication_style}\n`;
        markdown += `- Engagement score: ${(speaker.engagement_score * 100).toFixed(0)}%\n\n`;
      });
    }
    
    // Conversation quality
    markdown += `## Conversation Quality\n\n`;
    const quality = metadata.conversation_quality;
    markdown += `- **Participation Balance:** ${(quality.participation_balance * 100).toFixed(0)}%\n`;
    markdown += `- **Interruption Rate:** ${quality.interruption_rate.toFixed(1)} per minute\n`;
    markdown += `- **Silence:** ${quality.silence_percentage.toFixed(1)}%\n`;
    markdown += `- **Efficiency Score:** ${quality.meeting_efficiency_score}%\n`;
    markdown += `- **Engagement Level:** ${quality.engagement_level}\n`;
    
    // Action items with structure
    if (metadata.structured_action_items?.length > 0) {
      markdown += `\n## Action Items\n\n`;
      metadata.structured_action_items.forEach((item, i) => {
        markdown += `${i + 1}. **${item.text}**\n`;
        if (item.assignee) markdown += `   - Assignee: ${item.assignee}\n`;
        if (item.due_date) markdown += `   - Due: ${item.due_date}\n`;
        markdown += `   - Priority: ${item.priority}\n`;
        markdown += `   - Category: ${item.category}\n\n`;
      });
    }
    
    // Decisions
    if (metadata.decisions_made?.length > 0) {
      markdown += `\n## Decisions Made\n\n`;
      metadata.decisions_made.forEach((decision, i) => {
        markdown += `${i + 1}. ${decision.text}\n`;
        markdown += `   - Speaker: ${decision.speaker}\n`;
        markdown += `   - Confidence: ${(decision.confidence * 100).toFixed(0)}%\n\n`;
      });
    }
    
    // Commitments
    if (metadata.commitments_given?.length > 0) {
      markdown += `\n## Commitments\n\n`;
      metadata.commitments_given.forEach((commitment, i) => {
        markdown += `${i + 1}. ${commitment.text}\n`;
        markdown += `   - By: ${commitment.person}\n\n`;
      });
    }
    
    // Key moments
    if (metadata.key_moments?.length > 0) {
      markdown += `\n## Key Moments\n\n`;
      metadata.key_moments.forEach(moment => {
        const time = Math.floor(moment.timestamp_start / 60);
        markdown += `- **[${time}:00]** ${moment.title}`;
        if (moment.description) markdown += `: ${moment.description}`;
        markdown += `\n`;
      });
      markdown += `\n`;
    }
    
    // Questions analysis
    if (metadata.questions_analysis?.total_count > 0) {
      markdown += `\n## Questions Analysis\n\n`;
      markdown += `- **Total Questions:** ${metadata.questions_analysis.total_count}\n`;
      markdown += `- **Unanswered:** ${metadata.questions_analysis.unanswered_count}\n\n`;
    }
    
    // Topics
    if (transcript.topics?.length > 0) {
      markdown += `\n## Topics Discussed\n\n`;
      transcript.topics.forEach((topic, i) => {
        const startTime = Math.floor(topic.start_time / 60);
        const endTime = Math.floor(topic.end_time / 60);
        markdown += `${i + 1}. **[${startTime}:00 - ${endTime}:00]** ${topic.text}\n`;
      });
      markdown += `\n`;
    }
    
    // Full transcript (optional - can be toggled)
    if (transcript.sentences?.length > 0 && VERBOSE) {
      markdown += `\n## Full Transcript\n\n`;
      let currentSpeaker = '';
      let speakerText = '';
      
      transcript.sentences.forEach((sentence, index) => {
        if (sentence.speaker_id !== currentSpeaker) {
          if (currentSpeaker && speakerText) {
            markdown += `**${currentSpeaker}:** ${speakerText.trim()}\n\n`;
          }
          currentSpeaker = sentence.speaker_id;
          speakerText = sentence.text + ' ';
        } else {
          speakerText += sentence.text + ' ';
        }
        
        if (index === transcript.sentences.length - 1 && speakerText) {
          markdown += `**${currentSpeaker}:** ${speakerText.trim()}\n\n`;
        }
      });
    }
    
    // Footer
    markdown += `---\n\n`;
    markdown += `*Enhanced sync with V2 features on ${new Date().toISOString()}*\n`;
    markdown += `*Transcript ID: ${transcript.id}*\n`;
    
    return markdown;
  }
}

/**
 * Main sync function with V2 enhancements
 */
async function syncFirefliesTranscriptsV2() {
  console.log('🚀 Starting Enhanced Fireflies Sync V2...\n');
  console.log('📊 This version includes:');
  console.log('   ✓ Complete speaker analytics');
  console.log('   ✓ Sentiment analysis');
  console.log('   ✓ Structured action items');
  console.log('   ✓ Decisions & commitments');
  console.log('   ✓ Meeting effectiveness scoring');
  console.log('   ✓ Key moments extraction\n');
  
  const fireflies = new FirefliesClientV2(FIREFLIES_API_KEY);
  const results = {
    processed: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Step 1: Get list of transcripts
    console.log(`📋 Fetching transcript list from Fireflies (limit: ${SYNC_LIMIT})...`);
    const transcripts = await fireflies.getTranscripts(SYNC_LIMIT);
    console.log(`Found ${transcripts.length} transcripts\n`);

    // Step 2: Check which ones already exist
    console.log('🔍 Checking existing meetings in database...');
    const existingIds = new Set();
    
    const { data: existingMeetings, error: fetchError } = await supabase
      .from('meetings')
      .select('fireflies_id')
      .not('fireflies_id', 'is', null);
    
    if (fetchError) {
      console.error('Error fetching existing meetings:', fetchError);
    } else {
      existingMeetings?.forEach(m => existingIds.add(m.fireflies_id));
      console.log(`Found ${existingIds.size} existing meetings\n`);
    }

    // Step 3: Process each transcript with V2 features
    for (const transcript of transcripts) {
      console.log(`\n📄 Processing: ${transcript.title}`);
      console.log(`   ID: ${transcript.id}`);
      
      try {
        // Skip if already processed (optional - can reprocess for V2 features)
        if (existingIds.has(transcript.id) && !args['force']) {
          console.log(`   ⏭️  Skipped (already exists, use --force to reprocess)`);
          results.skipped++;
          continue;
        }

        // Get ENHANCED transcript details
        console.log(`   📥 Fetching enhanced transcript details...`);
        const fullTranscript = await fireflies.getEnhancedTranscriptDetails(transcript.id);
        
        // Extract V2 metadata
        const metadata = fireflies.extractEnhancedMetadataV2(fullTranscript);
        console.log(`   📊 Extracted enhanced metadata:`);
        console.log(`      - ${metadata.total_words} words`);
        console.log(`      - ${metadata.speaker_count} speakers`);
        console.log(`      - ${metadata.structured_action_items.length} action items`);
        console.log(`      - ${metadata.decisions_made.length} decisions`);
        console.log(`      - Sentiment: ${metadata.sentiment_analysis.dominant_sentiment}`);
        console.log(`      - Effectiveness: ${metadata.meeting_effectiveness.overall_score}%`);
        
        // Format as enhanced markdown
        const markdown = fireflies.formatEnhancedMarkdownV2(fullTranscript, metadata);
        const fileName = `${transcript.id}_v2.md`;
        
        let publicUrl = '';
        
        if (!DRY_RUN) {
          // Upload to Supabase Storage
          console.log(`   📤 Uploading enhanced transcript to storage...`);
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('meetings')
            .upload(fileName, markdown, {
              contentType: 'text/markdown',
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('meetings')
            .getPublicUrl(fileName);
          publicUrl = urlData.publicUrl;
        } else {
          console.log(`   📤 [DRY RUN] Would upload enhanced transcript: ${fileName}`);
          publicUrl = `https://dry-run-url/${fileName}`;
        }

        // Prepare enhanced meeting record
        const meetingRecord = {
          id: transcript.id,
          fireflies_id: transcript.id,
          title: metadata.title,
          date: metadata.date,
          duration_minutes: metadata.duration_minutes,
          participants: metadata.participants,
          speaker_count: metadata.speaker_count,
          transcript_url: metadata.transcript_url,
          audio_url: metadata.audio_url,
          video_url: metadata.video_url,
          storage_url: publicUrl,
          organizer_email: metadata.organizer_email,
          host_email: metadata.host_email,
          meeting_type: metadata.meeting_type,
          
          // V2 ENHANCED FIELDS
          sentiment_analysis: metadata.sentiment_analysis,
          speaker_analytics: metadata.speaker_analytics,
          conversation_quality: metadata.conversation_quality,
          structured_action_items: metadata.structured_action_items,
          decisions_made: metadata.decisions_made,
          commitments_given: metadata.commitments_given,
          questions_analysis: metadata.questions_analysis,
          key_moments: metadata.key_moments,
          competitive_insights: metadata.competitive_insights,
          meeting_effectiveness: metadata.meeting_effectiveness,
          
          // Summary fields
          summary: metadata.summary ? {
            overview: metadata.summary,
            action_items: metadata.action_items,
            keywords: metadata.keywords,
            outline: metadata.outline,
            notes: metadata.notes,
            bullet_points: metadata.bullet_points,
          } : null,
          
          // Additional fields
          topics: metadata.topics,
          meeting_attendees: metadata.meeting_attendees,
          total_words: metadata.total_words,
          question_count: metadata.question_count,
          task_count: metadata.task_count,
          silence_percentage: metadata.silence_percentage,
          has_action_items: metadata.has_action_items,
          has_video: metadata.has_video,
          
          // Timestamps
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          synced_at: metadata.synced_at,
        };

        // Save to meetings table
        if (!DRY_RUN) {
          console.log(`   💾 Saving enhanced data to database...`);
          const { error: insertError } = await supabase
            .from('meetings')
            .upsert(meetingRecord, {
              onConflict: 'id',
            });

          if (insertError) {
            throw insertError;
          }
          console.log(`   ✅ Successfully processed with V2 enhancements`);
        } else {
          console.log(`   💾 [DRY RUN] Would save enhanced data to database`);
          console.log(`   ✅ [DRY RUN] Would be successfully processed`);
        }
        
        results.processed++;

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({
          transcript_id: transcript.id,
          title: transcript.title,
          error: error.message,
        });
      }
    }

    // Step 4: Enhanced summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ENHANCED SYNC V2 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Processed: ${results.processed}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Failed: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(err => {
        console.log(`   - ${err.title}: ${err.error}`);
      });
    }

    console.log('\n✨ Enhanced sync V2 complete!');
    console.log('   Your meetings now have:');
    console.log('   • Detailed speaker analytics');
    console.log('   • Sentiment analysis');
    console.log('   • Structured action items');
    console.log('   • Meeting effectiveness scores');
    console.log('   • And much more!\n');

  } catch (error) {
    console.error('Fatal error during sync:', error);
    process.exit(1);
  }
}

// Run the enhanced sync
syncFirefliesTranscriptsV2()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });