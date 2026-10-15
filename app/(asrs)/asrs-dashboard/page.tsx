"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  MessageCircle, 
  Calculator, 
  Database, 
  BookOpen,
  Bot,
  ExternalLink,
  Zap,
  Search,
  FileSpreadsheet,
  PenTool
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  category: "chat" | "data" | "form" | "reference" | "tool";
  status: "active" | "beta" | "new";
  features: string[];
}

const resources: Resource[] = [
  {
    id: "fm-global-expert",
    title: "FM Global Expert Chat",
    description: "AI agent trained on FM Global 8-34 ASRS standards. Ask questions about sprinkler requirements, compliance, and design specifications.",
    href: "/fm-global-expert",
    icon: Bot,
    category: "chat",
    status: "active",
    features: ["Real-time AI responses", "Railway API integration", "Expert knowledge base", "Technical compliance guidance"]
  },
  {
    id: "fm-global-tables",
    title: "Tables & Figures Database",
    description: "Complete searchable database of FM Global figures and tables. Find specific requirements, dimensions, and protection schemes.",
    href: "/fm-global-tables",
    icon: Database,
    category: "data",
    status: "active",
    features: ["119-page document coverage", "Advanced search & filters", "32 figures, 36 tables", "ASRS type categorization"]
  },
  {
    id: "fm-global-form",
    title: "Requirements Form",
    description: "Interactive form that guides you through ASRS sprinkler requirements based on your specific system configuration.",
    href: "/fm-global-form",
    icon: FileText,
    category: "form",
    status: "active",
    features: ["Dynamic form generation", "System type detection", "Requirement calculation", "Compliance validation"]
  },
  {
    id: "asrs-main-chat",
    title: "ASRS Main Chat",
    description: "General ASRS consultation chat for system design questions, project planning, and technical guidance.",
    href: "/asrs-main-chat",
    icon: MessageCircle,
    category: "chat",
    status: "active",
    features: ["Project consultation", "Design guidance", "Cost estimation", "Technical support"]
  },
  {
    id: "fm-global-pdf",
    title: "FM Global PDF Resources",
    description: "Direct access to FM Global 8-34 document sections, including table of contents and specific requirement pages.",
    href: "/fm-global-pdf",
    icon: BookOpen,
    category: "reference",
    status: "active",
    features: ["Original document sections", "Table of contents", "Direct page access", "Section navigation"]
  },
  {
    id: "asrs-design",
    title: "ASRS Design Tool",
    description: "Design and configuration tool for planning ASRS sprinkler systems with visual layout assistance.",
    href: "/asrs-design",
    icon: PenTool,
    category: "tool",
    status: "beta",
    features: ["Visual design interface", "Layout planning", "Configuration wizard", "Design validation"]
  },
  {
    id: "asrs-form",
    title: "ASRS Configuration Form",
    description: "Detailed form for capturing ASRS system specifications and generating tailored recommendations.",
    href: "/asrs-form",
    icon: Calculator,
    category: "form",
    status: "active",
    features: ["System configuration", "Specification capture", "Custom recommendations", "Export capabilities"]
  },
  {
    id: "asrs-agent-chat",
    title: "ASRS Agent Chat",
    description: "Specialized AI chat agent focused on ASRS system analysis, troubleshooting, and optimization.",
    href: "/asrs-agent-chat",
    icon: Zap,
    category: "chat",
    status: "new",
    features: ["System analysis", "Performance optimization", "Troubleshooting assistance", "Best practices guidance"]
  },
  {
    id: "asrs-resources",
    title: "ASRS Resources",
    description: "Comprehensive collection of ASRS documentation, guides, and reference materials.",
    href: "/asrs-resources",
    icon: FileSpreadsheet,
    category: "reference",
    status: "active",
    features: ["Documentation library", "Implementation guides", "Case studies", "Best practices"]
  }
];

const categoryConfig = {
  chat: { label: "AI Chat", color: "bg-blue-500", lightColor: "bg-blue-50 border-blue-200" },
  data: { label: "Database", color: "bg-green-500", lightColor: "bg-green-50 border-green-200" },
  form: { label: "Forms", color: "bg-purple-500", lightColor: "bg-purple-50 border-purple-200" },
  reference: { label: "Reference", color: "bg-orange-500", lightColor: "bg-orange-50 border-orange-200" },
  tool: { label: "Tools", color: "bg-pink-500", lightColor: "bg-pink-50 border-pink-200" }
};

const statusConfig = {
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  beta: { label: "Beta", color: "bg-yellow-100 text-yellow-800" },
  new: { label: "New", color: "bg-blue-100 text-blue-800" }
};

export default function ASRSDashboard() {
  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  const stats = {
    totalResources: resources.length,
    chatAgents: resources.filter(r => r.category === "chat").length,
    databases: resources.filter(r => r.category === "data").length,
    forms: resources.filter(r => r.category === "form").length
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="ASRS & FM Global Dashboard"
        description="Comprehensive resources for Automated Storage and Retrieval Systems (ASRS) sprinkler design and FM Global 8-34 compliance"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-brand">{stats.totalResources}</div>
            <div className="text-sm text-muted-foreground">Total Resources</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.chatAgents}</div>
            <div className="text-sm text-muted-foreground">AI Chat Agents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.databases}</div>
            <div className="text-sm text-muted-foreground">Databases</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.forms}</div>
            <div className="text-sm text-muted-foreground">Forms & Tools</div>
          </CardContent>
        </Card>
      </div>

      {/* Resource Categories */}
      {Object.entries(groupedResources).map(([category, categoryResources]) => {
        const config = categoryConfig[category as keyof typeof categoryConfig];
        return (
          <div key={category} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full", config.color)} />
              <h2 className="text-xl font-semibold capitalize">{config.label}</h2>
              <Badge variant="outline">{categoryResources.length}</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoryResources.map((resource) => {
                const Icon = resource.icon;
                return (
                  <Card key={resource.id} className={cn("group hover:shadow-lg transition-all duration-200 border-2", config.lightColor)}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", config.color)}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-lg group-hover:text-brand transition-colors">
                              {resource.title}
                            </CardTitle>
                          </div>
                        </div>
                        <Badge className={statusConfig[resource.status].color}>
                          {statusConfig[resource.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-4">
                      <CardDescription className="text-sm leading-relaxed">
                        {resource.description}
                      </CardDescription>

                      {/* Features */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Key Features
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {resource.features.slice(0, 3).map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {resource.features.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{resource.features.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link href={resource.href} className="block">
                        <Button className="w-full group-hover:bg-brand group-hover:text-white transition-colors">
                          Open Resource
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Getting Started Section */}
      <Card className="bg-gradient-to-r from-brand/5 to-brand/10 border-brand/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Getting Started
          </CardTitle>
          <CardDescription>
            New to ASRS sprinkler design? Start with these recommended resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Link href="/fm-global-expert">
              <Button variant="outline" className="w-full justify-start hover:bg-brand hover:text-white">
                <Bot className="mr-2 h-4 w-4" />
                Start with AI Chat
              </Button>
            </Link>
            <Link href="/fm-global-tables">
              <Button variant="outline" className="w-full justify-start hover:bg-brand hover:text-white">
                <Database className="mr-2 h-4 w-4" />
                Browse Tables
              </Button>
            </Link>
            <Link href="/fm-global-form">
              <Button variant="outline" className="w-full justify-start hover:bg-brand hover:text-white">
                <FileText className="mr-2 h-4 w-4" />
                Use Requirements Form
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}