import { Suspense } from "react"
import { HeroMetrics } from "@/components/insights/hero-metrics"
import { ProjectHealthMatrix } from "@/components/insights/project-health-matrix"
import { InsightsTimeline } from "@/components/insights/insights-timeline"
import { ActionCommandCenter } from "@/components/insights/action-command-center"
import { SentimentAnalytics } from "@/components/insights/sentiment-analytics"
import { DashboardSkeleton } from "@/components/insights/dashboard-skeleton"

export const dynamic = "force-dynamic"

export default async function InsightsDashboard() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1600px] mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Project Insights Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time intelligence from your meeting transcripts
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-background border rounded-lg hover:bg-muted transition-colors">
            Export Report
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Generate Summary
          </button>
        </div>
      </div>

      {/* Hero Metrics Section */}
      <Suspense fallback={<DashboardSkeleton type="metrics" />}>
        <HeroMetrics />
      </Suspense>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Project Health */}
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<DashboardSkeleton type="health" />}>
            <ProjectHealthMatrix />
          </Suspense>
          
          <Suspense fallback={<DashboardSkeleton type="timeline" />}>
            <InsightsTimeline />
          </Suspense>
        </div>

        {/* Right Column - Actions & Sentiment */}
        <div className="space-y-6">
          <Suspense fallback={<DashboardSkeleton type="actions" />}>
            <ActionCommandCenter />
          </Suspense>
          
          <Suspense fallback={<DashboardSkeleton type="sentiment" />}>
            <SentimentAnalytics />
          </Suspense>
        </div>
      </div>
    </div>
  )
}