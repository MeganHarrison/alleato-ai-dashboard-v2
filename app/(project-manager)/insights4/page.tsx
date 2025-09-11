import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MeetingIntelligenceChat from "@/components/meetings/meeting-intelligence-chat";
import MeetingsTable from "@/components/meetings/meetings-table";
import MeetingUpload from "@/components/meetings/meeting-upload";
import MeetingInsightsGenerator from "@/components/meetings/meeting-insights-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMeetingStatistics } from "@/app/actions/meeting-insights-actions";

export const metadata: Metadata = {
  title: "Meeting Intelligence | Alleato AI",
  description: "AI-powered meeting insights and project management",
};

export default async function MeetingIntelligencePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/signin");

  // Fetch recent meetings with metadata
  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .order("date", { ascending: false })
    .limit(50);

  // Fetch meeting statistics
  const statsResult = await getMeetingStatistics();
  const stats = (statsResult as any)?.stats || null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meeting Intelligence</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered insights from all your team meetings
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Total Meetings</div>
          <div className="text-2xl font-bold">{stats?.total_meetings || 0}</div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">This Week</div>
          <div className="text-2xl font-bold">
            {stats?.meetings_this_week || 0}
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Action Items</div>
          <div className="text-2xl font-bold">
            {stats?.pending_actions || 0}
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="text-sm text-muted-foreground">Identified Risks</div>
          <div className="text-2xl font-bold">{stats?.open_risks || 0}</div>
        </div>
      </div>

      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="chat">AI Assistant</TabsTrigger>
          <TabsTrigger value="meetings">All Meetings</TabsTrigger>
          <TabsTrigger value="insights">Generate Insights</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">
              Meeting Intelligence Assistant
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ask questions about your meetings, get insights, identify
              patterns, and track action items across all projects.
            </p>
            <MeetingIntelligenceChat />
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-4">
          <MeetingsTable meetings={meetings || []} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <MeetingInsightsGenerator />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <MeetingUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}
