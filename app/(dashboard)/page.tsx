import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { SectionCards } from "@/components/section-cards";
import { ProjectsViewWrapper } from "@/components/projects/projects-view-wrapper";
import { getCurrentProjects } from "@/app/actions/dashboard-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUpIcon, TrendingDownIcon, DollarSign, Users, Activity, Briefcase } from "lucide-react";

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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-white px-4 pb-6 pt-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl sm:text-4xl lg:text-[80px] font-didot text-[#DB802D]">
              hello.
            </h1>
            <p className="text-gray-600 text-sm mt-1 lg:hidden">
              Welcome back to your dashboard
            </p>
          </div>
          <Button
            size="sm"
            className="bg-[#DB802D] hover:bg-[#c1731f] text-white rounded-full px-4 py-2 text-sm font-medium"
          >
            Quick Start
          </Button>
        </div>
      </div>

      {/* Mobile-Optimized Quick Stats Cards */}
      <div className="px-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Overview</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="bg-white">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-5 w-5 text-gray-600" />
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${stat.positive ? 'text-green-700 border-green-200' : 'text-red-700 border-red-200'}`}
                    >
                      {stat.positive ? <TrendingUpIcon className="h-3 w-3 mr-1" /> : <TrendingDownIcon className="h-3 w-3 mr-1" />}
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className="text-xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-xs text-gray-600">{stat.title}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Mobile-First Service Cards */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">AI Services</h2>
          <Button variant="ghost" size="sm" className="text-[#DB802D]">
            View All
          </Button>
        </div>
        <div className="space-y-3">
          {services.map((service, index) => (
            service.isExternal ? (
              <a
                href={service.href}
                key={index}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Card className={`${service.color} border transition-all duration-200 active:scale-[0.98] touch-manipulation`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{service.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {service.title}
                        </h3>
                        <p className="text-gray-600 text-xs line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ) : (
              <Link href={service.href} key={index} className="block">
                <Card className={`${service.color} border transition-all duration-200 active:scale-[0.98] touch-manipulation`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{service.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm mb-1">
                          {service.title}
                        </h3>
                        <p className="text-gray-600 text-xs line-clamp-2">
                          {service.description}
                        </p>
                      </div>
                      <div className="text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          ))}
        </div>
      </div>

      {/* Mobile-Optimized Projects Section */}
      <div className="bg-white">
        <div className="px-4 pt-6">
          <ProjectsViewWrapper projects={currentProjects} defaultView="card" />
        </div>
      </div>

      {/* Desktop Only - Detailed Metrics */}
      <div className="hidden lg:block px-4 lg:px-6 mt-8">
        <SectionCards />
      </div>
    </div>
  );
}
