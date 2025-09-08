import { getCurrentProjects } from "@/app/actions/dashboard-actions";
import { ProjectsViewWrapper } from "@/components/projects/projects-view-wrapper";
import { SectionCards } from "@/components/section-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  Briefcase,
  DollarSign,
  TrendingDownIcon,
  TrendingUpIcon,
  Users,
} from "lucide-react";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { 
  SidebarProvider, 
  SidebarInset, 
  SidebarTrigger 
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DynamicBreadcrumbs } from "@/components/dynamic-breadcrumbs";
import ErrorBoundary from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";

export default async function DashboardHome() {
  const currentProjects = await getCurrentProjects();
  const services = [
    {
      title: "ASRS GURU",
      description: "Navigating FM Global 8-34 with clarity and confidence.",
      href: "/asrs-design",
      isExternal: false,
      icon: "🏗️",
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Project Maestro",
      description:
        "Your right-hand strategist, research assistant, & business brain extension, all in one.",
      href: "/projects-dashboard",
      isExternal: false,
      icon: "🎯",
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Company Knowledge Base",
      description: "Central hub for all SOP's and documentation",
      href: "http://localhost:4321/",
      isExternal: true,
      icon: "📚",
      color: "bg-purple-50 border-purple-200",
    },
  ];

  // Quick stats for mobile-first dashboard
  const quickStats = [
    {
      title: "Total Revenue",
      value: "$1,250.00",
      trend: "+12.5%",
      icon: DollarSign,
      positive: true,
    },
    {
      title: "Active Projects",
      value: currentProjects.length.toString(),
      trend: "+3",
      icon: Briefcase,
      positive: true,
    },
    {
      title: "New Customers",
      value: "1,234",
      trend: "-20%",
      icon: Users,
      positive: false,
    },
    {
      title: "Growth Rate",
      value: "4.5%",
      trend: "+4.5%",
      icon: Activity,
      positive: true,
    },
  ];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumbs />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mx-[2.5%] sm:ml-6 sm:mr-6">
          <ErrorBoundary>
            <div className="min-h-screen">
              {/* Compact Mobile Header */}
              <div className="pb-3 pt-2">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h1 className="text-xl sm:text-[60px] lg:text-[80px] font-didot text-[#DB802D] leading-tight">
                      hello.
                    </h1>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#DB802D] hover:bg-[#c1731f] text-white rounded-full px-3 py-1.5 text-xs font-medium"
                  >
                    Quick Start
                  </Button>
                </div>
              </div>

              {/* Dense Mobile Stats Cards */}
              <div className="mb-4">
                <h2 className="text-base font-semibold text-gray-900 mb-2 px-1">
                  Quick Overview
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {quickStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <Card key={index} className="bg-white border-0 shadow-sm">
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <Icon className="h-4 w-4 text-gray-600" />
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0.5 ${
                                stat.positive
                                  ? "text-green-700 border-green-200"
                                  : "text-red-700 border-red-200"
                              }`}
                            >
                              {stat.positive ? (
                                <TrendingUpIcon className="h-2.5 w-2.5 mr-1" />
                              ) : (
                                <TrendingDownIcon className="h-2.5 w-2.5 mr-1" />
                              )}
                              {stat.trend}
                            </Badge>
                          </div>
                          <div className="text-lg font-bold text-gray-900 mb-0.5">
                            {stat.value}
                          </div>
                          <div className="text-[10px] text-gray-600 leading-tight">
                            {stat.title}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Compact Mobile Service Cards */}
              <div className="px-2 mb-4">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-base font-semibold text-gray-900">AI Services</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[#DB802D] text-xs px-2 py-1"
                  >
                    View All
                  </Button>
                </div>
                <div className="space-y-2">
                  {services.map((service, index) =>
                    service.isExternal ? (
                      <a
                        href={service.href}
                        key={index}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Card
                          className={`${service.color} border-0 shadow-sm transition-all duration-200 active:scale-[0.98] touch-manipulation`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-2.5">
                              <div className="text-xl flex-shrink-0">
                                {service.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm mb-0.5 leading-tight">
                                  {service.title}
                                </h3>
                                <p className="text-gray-600 text-xs line-clamp-1 leading-tight">
                                  {service.description}
                                </p>
                              </div>
                              <div className="text-gray-400 flex-shrink-0">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </a>
                    ) : (
                      <Link href={service.href} key={index} className="block">
                        <Card
                          className={`${service.color} border-0 shadow-sm transition-all duration-200 active:scale-[0.98] touch-manipulation`}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center space-x-2.5">
                              <div className="text-xl flex-shrink-0">
                                {service.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 text-sm mb-0.5 leading-tight">
                                  {service.title}
                                </h3>
                                <p className="text-gray-600 text-xs line-clamp-1 leading-tight">
                                  {service.description}
                                </p>
                              </div>
                              <div className="text-gray-400 flex-shrink-0">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )
                  )}
                </div>
              </div>

              {/* Compact Mobile Projects Section */}
              <div>
                <div className="pt-4">
                  <ProjectsViewWrapper projects={currentProjects} defaultView="card" />
                </div>
              </div>

              {/* Desktop Only - Detailed Metrics */}
              <div className="hidden lg:block px-4 lg:px-6 mt-8">
                <SectionCards />
              </div>
            </div>
          </ErrorBoundary>
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
