"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AIInsightsDisplay from "@/components/pm-rag/ai-insights-display";
import RAGChatInterface from "@/components/pm-rag/rag-chat-interface";
import { Brain, MessageSquare, TrendingUp, Calendar, Users, Clock } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";

interface Meeting {
  id: string;
  title: string;
  date: string;
  participants?: string[];
  duration_minutes?: number;
  tags?: string[];
}

export default function PMRAGPage() {
  const [activeTab, setActiveTab] = useState<string>("insights");
  const [recentMeetings, setRecentMeetings] = useState<Meeting[]>([]);

  useEffect(() => {
    const fetchRecentMeetings = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("meetings")
        .select("id, title, date, participants, duration_minutes, tags")
        .order("date", { ascending: false })
        .limit(5);
      
      if (data) {
        setRecentMeetings(data);
      }
    };

    fetchRecentMeetings();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <div>
          <PageHeader
            title="Meeting Insights"
            description="AI-powered meeting intelligence platform with insights extraction and
          semantic search"
          />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            RAG Chat
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* RAG Chat Tab */}
        <TabsContent value="chat" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RAGChatInterface />
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Meetings
                    </span>
                    <span className="font-semibold">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Total Insights
                    </span>
                    <span className="font-semibold">27</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Active Projects
                    </span>
                    <span className="font-semibold">2</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardHeader className="pb-4 bg-gradient-to-r from-brand/5 to-brand/10 border-b border-brand/20">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-brand/20">
                      <Calendar className="h-4 w-4 text-brand" />
                    </div>
                    <span className="text-brand">Recent Meetings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {recentMeetings.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No recent meetings found</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {recentMeetings.map((meeting, index) => (
                        <div
                          key={meeting.id}
                          className="group relative p-4 hover-lift hover:bg-brand/5 transition-all duration-200 animate-in slide-in-from-bottom"
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animationFillMode: 'both'
                          }}
                        >
                          {/* Brand accent line */}
                          <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-brand to-brand/50 scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-top" />
                          
                          <div className="space-y-3 pl-4">
                            <div className="flex items-start justify-between gap-3">
                              <h4 className="font-semibold text-sm leading-tight group-hover:text-brand transition-colors duration-200">
                                {meeting.title}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className="text-xs shrink-0 border-brand/20 text-brand bg-brand/5 hover:bg-brand/10 transition-colors"
                              >
                                {formatDate(meeting.date)}
                              </Badge>
                            </div>
                            
                            {/* Meeting metadata with enhanced styling */}
                            <div className="flex items-center gap-4 text-xs">
                              {meeting.duration_minutes && (
                                <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-brand/80 transition-colors">
                                  <div className="p-1 rounded bg-muted group-hover:bg-brand/10 transition-colors">
                                    <Clock className="h-3 w-3" />
                                  </div>
                                  <span className="font-medium">{meeting.duration_minutes} min</span>
                                </div>
                              )}
                              {meeting.participants && meeting.participants.length > 0 && (
                                <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-brand/80 transition-colors">
                                  <div className="p-1 rounded bg-muted group-hover:bg-brand/10 transition-colors">
                                    <Users className="h-3 w-3" />
                                  </div>
                                  <span className="font-medium">{meeting.participants.length} participants</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Enhanced tags */}
                            {meeting.tags && meeting.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {meeting.tags.slice(0, 3).map((tag, tagIndex) => (
                                  <Badge
                                    key={tagIndex}
                                    variant="secondary"
                                    className="text-xs py-1 px-2 bg-muted hover:bg-brand/10 hover:text-brand transition-colors cursor-default"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                                {meeting.tags.length > 3 && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs py-1 px-2 border-brand/30 text-brand/70 cursor-default"
                                  >
                                    +{meeting.tags.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <AIInsightsDisplay />
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Architecture</CardTitle>
                <CardDescription>How the PM RAG system works</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="font-semibold">1. Meeting Ingestion</h4>
                  <p className="text-sm text-muted-foreground">
                    Fireflies API → Supabase meetings table
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">2. Embedding Generation</h4>
                  <p className="text-sm text-muted-foreground">
                    Meeting content → 384-dimensional vectors
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">3. Insight Extraction</h4>
                  <p className="text-sm text-muted-foreground">
                    AI analysis → Categorized insights with confidence scores
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">4. Semantic Search</h4>
                  <p className="text-sm text-muted-foreground">
                    User queries → Vector similarity → GPT-4 responses
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>Capabilities of the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1">
                    <Brain className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      Automated Meeting Sync
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Fetches transcripts from Fireflies every hour
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      AI Insights Generation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Extracts risks, opportunities, decisions, and action items
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="rounded-full bg-primary/10 p-1">
                    <MessageSquare className="h-3 w-3 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Natural Language Q&A</p>
                    <p className="text-xs text-muted-foreground">
                      Chat interface for querying meeting data
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Data Flow</CardTitle>
              <CardDescription>
                How information moves through the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-mono bg-muted p-4 rounded-lg">
                <pre>{`Fireflies API
    ↓
Sync Pipeline (Python)
    ↓
Supabase Database
    ├── meetings table
    ├── meeting_embeddings (vectors)
    └── ai_insights table
    ↓
AI Processing (GPT-4)
    ↓
Frontend Interface
    ├── Insights Display
    └── RAG Chat`}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
