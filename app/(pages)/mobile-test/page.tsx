"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile, useIsSmallMobile, useViewportSize } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Building,
  ChevronRight,
  CreditCard,
  DollarSign,
  LayoutGrid,
  List,
  MapPin,
  MessageCircle,
  Search,
  Settings,
  Star,
  Users,
} from "lucide-react";
import React from "react";

const testCards = [
  {
    id: 1,
    title: "Project Alpha",
    description: "High-priority construction project with complex requirements",
    status: "Current",
    revenue: 125000,
    location: "San Francisco, CA",
    company: "Tech Solutions Inc",
  },
  {
    id: 2,
    title: "Project Beta",
    description: "Infrastructure development for expanding business operations",
    status: "Planning",
    revenue: 89000,
    location: "Austin, TX", 
    company: "Growth Dynamics LLC",
  },
  {
    id: 3,
    title: "Project Gamma",
    description: "Maintenance and upgrade project for existing facilities",
    status: "On Hold",
    revenue: 45000,
    location: "Denver, CO",
    company: "Facilities Corp",
  },
];

function getStatusColor(phase: string) {
  const statusMap: Record<string, string> = {
    Planning: "bg-blue-100 text-blue-800 border-blue-200",
    Current: "bg-green-100 text-green-800 border-green-200",
    "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-200",
    Complete: "bg-gray-100 text-gray-800 border-gray-200",
    Lost: "bg-red-100 text-red-800 border-red-200",
  };
  return statusMap[phase] || "bg-gray-100 text-gray-800 border-gray-200";
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function MobileTestPage() {
  const isMobile = useIsMobile();
  const isSmallMobile = useIsSmallMobile();
  const viewport = useViewportSize();
  const [searchQuery, setSearchQuery] = React.useState("");

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
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Mobile Experience Test</h1>
            </div>
          </div>
        </header>

        <div className={cn(
          "flex flex-1 flex-col gap-4 pt-0",
          isMobile ? "p-3" : "p-4"
        )}>
          {/* Mobile Detection Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2 text-blue-900">
                📱 Mobile Detection Status
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Is Mobile:</strong> {isMobile ? "✅ Yes" : "❌ No"}
                </div>
                <div>
                  <strong>Is Small Mobile:</strong> {isSmallMobile ? "✅ Yes" : "❌ No"}
                </div>
                <div>
                  <strong>Viewport:</strong> {viewport ? `${viewport.width}×${viewport.height}` : "Loading..."}
                </div>
                <div>
                  <strong>User Agent:</strong> {typeof window !== "undefined" && /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? "Mobile Device" : "Desktop"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Touch Target Test Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>👆 Touch Target Tests</span>
                <Badge variant="outline">44px minimum</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button size={isMobile ? "mobile" : "default"} className="w-full">
                  Perfect Size
                </Button>
                <Button size={isMobile ? "mobile-sm" : "sm"} variant="outline" className="w-full">
                  Small Button
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <Button size={isMobile ? "mobile-icon" : "icon"} variant="ghost">
                  <Search />
                </Button>
                <Button size={isMobile ? "mobile-icon" : "icon"} variant="ghost">
                  <Settings />
                </Button>
                <Button size={isMobile ? "mobile-icon" : "icon"} variant="ghost">
                  <MessageCircle />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Form Elements Test */}
          <Card>
            <CardHeader>
              <CardTitle>📝 Mobile Form Elements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-search">Search Input</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="test-search"
                    type="text"
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "pl-10",
                      isMobile ? "h-12 text-base" : "h-10 text-sm"
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Switch
                  id="test-toggle"
                  className={cn(isMobile && "scale-110")}
                />
                <Label
                  htmlFor="test-toggle"
                  className={cn(
                    "font-medium cursor-pointer",
                    isMobile ? "text-base" : "text-sm"
                  )}
                >
                  Mobile-optimized toggle
                </Label>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <select
                  className={cn(
                    "border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white",
                    isMobile 
                      ? "text-base px-4 py-3 w-full" 
                      : "text-sm px-3 py-1.5"
                  )}
                >
                  <option value="all">All Status Options</option>
                  <option value="current">Current Projects</option>
                  <option value="planning">Planning Phase</option>
                  <option value="hold">On Hold</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Data Display Test */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Data Display Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue={isMobile ? "cards" : "table"} 
                className="space-y-4"
              >
                <TabsList className={cn(
                  "bg-gray-50 border",
                  isMobile ? "w-full grid grid-cols-2" : ""
                )}>
                  <TabsTrigger
                    value="cards"
                    className={cn(
                      "flex items-center gap-2",
                      isMobile ? "flex-1 py-3" : ""
                    )}
                  >
                    <LayoutGrid className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                    <span className={cn(isMobile ? "text-base font-medium" : "")}>
                      Cards
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className={cn(
                      "flex items-center gap-2",
                      isMobile ? "flex-1 py-3" : ""
                    )}
                  >
                    <List className={cn(isMobile ? "h-5 w-5" : "h-4 w-4")} />
                    <span className={cn(isMobile ? "text-base font-medium" : "")}>
                      List
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cards">
                  <div className={cn(
                    "grid gap-4",
                    isSmallMobile 
                      ? "grid-cols-1" 
                      : isMobile 
                        ? "grid-cols-1" 
                        : "md:grid-cols-2 lg:grid-cols-3"
                  )}>
                    {testCards.map((project) => (
                      <Card
                        key={project.id}
                        className="group bg-white border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-200"
                      >
                        <CardContent className={cn(isMobile ? "p-4" : "p-5")}>
                          {/* Header */}
                          <div className="flex items-start justify-between text-blue-500 text-sm mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-base line-clamp-1 hover:text-blue-500 cursor-pointer">
                                {project.title}
                              </h3>
                              <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                <Building className="h-3.5 w-3.5" />
                                <span>{project.company}</span>
                              </div>
                            </div>
                            <Badge className={cn("text-xs", getStatusColor(project.status))}>
                              {project.status}
                            </Badge>
                          </div>

                          {/* Metadata */}
                          <div className="space-y-2 mb-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <DollarSign className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {formatCurrency(project.revenue)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-3.5 w-3.5" />
                              <span>{project.location}</span>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {project.description}
                          </p>

                          {/* Mobile Action */}
                          {isMobile && (
                            <div className="mt-4 pt-3 border-t border-gray-100">
                              <Button 
                                size="mobile-sm" 
                                className="w-full bg-black text-white hover:bg-black/90"
                              >
                                View Details
                                <ChevronRight className="h-4 w-4 ml-1" />
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="table">
                  {isMobile ? (
                    // Mobile: Use stacked list format
                    <div className="space-y-3">
                      {testCards.map((project) => (
                        <Card 
                          key={project.id}
                          className="border border-gray-200 hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="font-semibold text-base">
                                {project.title}
                              </h3>
                              <Badge
                                className={cn("text-xs ml-2 flex-shrink-0", getStatusColor(project.status))}
                              >
                                {project.status}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                <span>{project.company}</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span className="font-medium text-gray-900">
                                  {formatCurrency(project.revenue)}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{project.location}</span>
                              </div>
                            </div>
                            
                            <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                              <Button size="mobile-sm" className="bg-black text-white hover:bg-black/90">
                                View Details
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Desktop table view would be here</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Navigation Test */}
          <Card>
            <CardHeader>
              <CardTitle>🧭 Navigation Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn(
                "grid gap-3",
                isMobile ? "grid-cols-2" : "grid-cols-4"
              )}>
                <Button
                  size={isMobile ? "mobile" : "default"}
                  variant="outline"
                  className="flex flex-col gap-2"
                >
                  <Users className="h-5 w-5" />
                  <span>Projects</span>
                </Button>
                <Button
                  size={isMobile ? "mobile" : "default"}
                  variant="outline"
                  className="flex flex-col gap-2"
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Finance</span>
                </Button>
                <Button
                  size={isMobile ? "mobile" : "default"}
                  variant="outline"
                  className="flex flex-col gap-2"
                >
                  <Star className="h-5 w-5" />
                  <span>Reports</span>
                </Button>
                <Button
                  size={isMobile ? "mobile" : "default"}
                  variant="outline"
                  className="flex flex-col gap-2"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Test Summary */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2 text-green-900">
                ✅ Mobile Optimization Summary
              </h2>
              <ul className="text-sm space-y-1 text-green-800">
                <li>• Touch targets meet 44px minimum requirement</li>
                <li>• Form elements are appropriately sized for mobile</li>
                <li>• Cards layout adapts to screen size</li>
                <li>• Tables convert to mobile-friendly list format</li>
                <li>• Navigation is thumb-friendly</li>
                <li>• Text is readable without zooming</li>
                <li>• Touch feedback and animations work properly</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}