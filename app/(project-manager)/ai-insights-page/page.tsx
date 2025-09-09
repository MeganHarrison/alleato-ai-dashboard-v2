import { ChatInterface } from "@/components/chat/ChatInterface";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { format } from "date-fns";

interface InsightWithProject {
  id: string;
  project_id: number | null;
  insight_type: string;
  title: string;
  description: string;
  created_at: string;
  projects?: {
    name: string | null;
  } | null;
}

export default async function AiInsightsPage() {
  const supabase = await createClient();
  const { data: insights, error } = await supabase
    .from("ai_insights")
    .select(
      "id, project_id, insight_type, title, description, created_at, projects(name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching ai_insights:", error);
  }

  const grouped = (insights || []).reduce<
    Record<
      string,
      {
        projectId: string;
        projectName: string;
        insights: InsightWithProject[];
      }
    >
  >((acc, insight: InsightWithProject) => {
    const key = insight.project_id ? String(insight.project_id) : "unassigned";
    if (!acc[key]) {
      acc[key] = {
        projectId: key,
        projectName: insight.projects?.name || "Unassigned",
        insights: [],
      };
    }
    acc[key].insights.push(insight);
    return acc;
  }, {});

  const groups = Object.values(grouped);

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI Insights by Project</h1>
        <p className="text-muted-foreground">
          Browse AI-generated insights grouped by project
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="text-center text-muted-foreground">
          No insights available.
        </p>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {groups.map((group) => (
            <AccordionItem key={group.projectId} value={group.projectId}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{group.projectName}</span>
                  <Badge variant="secondary">{group.insights.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {group.insights.map((insight) => (
                    <Card key={insight.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {insight.title}
                          </CardTitle>
                          <Badge>{insight.insight_type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-2">
                          {insight.description}
                        </p>
                        <p className="text-xs text-right text-muted-foreground">
                          {format(new Date(insight.created_at), "PPP p")}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      <div className="pt-8">
        <ChatInterface />
      </div>
    </div>
  );
}
