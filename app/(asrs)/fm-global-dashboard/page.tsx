"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageCircle, Settings, Database, Grid3x3, FileImage } from "lucide-react";
import Link from "next/link";
import FMGlobalDataTables from "@/components/asrs/fm-global-data-tables";

export default function FMGlobalDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="FM Global Dashboard"
        description="FM Global 8-34 ASRS Sprinkler System Resources and Tools"
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Tables & Figures
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Tools & Resources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  FM Global Expert Chat
                </CardTitle>
                <CardDescription>
                  Get instant answers about ASRS sprinkler systems, compliance requirements, and design specifications.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/fm-global-expert">
                  <Button className="w-full">
                    Start Chat Session
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Requirements Form
                </CardTitle>
                <CardDescription>
                  Use our interactive form to determine specific ASRS sprinkler requirements for your project.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/fm-global-form">
                  <Button className="w-full" variant="outline">
                    Open Requirements Form
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Design Tools
                </CardTitle>
                <CardDescription>
                  Access design tools and resources for planning ASRS sprinkler installations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/asrs-design">
                  <Button className="w-full" variant="outline">
                    Open Design Tools
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Navigation</CardTitle>
              <CardDescription>
                Jump directly to commonly used resources and documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-3">
                <Link href="/asrs-dashboard">
                  <Button variant="outline" className="w-full justify-start">
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    ASRS Dashboard
                  </Button>
                </Link>
                <Link href="/fm-global-pdf">
                  <Button variant="outline" className="w-full justify-start">
                    <FileImage className="h-4 w-4 mr-2" />
                    PDF Resources
                  </Button>
                </Link>
                <Link href="/fm-global-tables">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Browse All Data
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tables & Figures Tab */}
        <TabsContent value="data" className="space-y-6">
          <FMGlobalDataTables />
        </TabsContent>

        {/* Tools & Resources Tab */}
        <TabsContent value="tools" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Interactive Tools
                </CardTitle>
                <CardDescription>
                  AI-powered tools for ASRS design and compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/fm-global-expert">
                  <Button className="w-full justify-start">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Expert Chat Assistant
                  </Button>
                </Link>
                <Link href="/fm-global-form">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Requirements Calculator
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Documentation
                </CardTitle>
                <CardDescription>
                  Official FM Global documents and resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/fm-global-pdf">
                  <Button variant="outline" className="w-full justify-start">
                    <FileImage className="h-4 w-4 mr-2" />
                    Browse PDF Library
                  </Button>
                </Link>
                <Link href="/fm-global-tables">
                  <Button variant="outline" className="w-full justify-start">
                    <Grid3x3 className="h-4 w-4 mr-2" />
                    View All Tables
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Recent Updates</CardTitle>
                <CardDescription>
                  Latest changes to FM Global 8-34 specifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-sm">Database Updated</div>
                      <div className="text-xs text-muted-foreground">
                        Added latest FM Global figures and tables with enhanced search capabilities
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <div className="font-medium text-sm">Expert Chat Enhanced</div>
                      <div className="text-xs text-muted-foreground">
                        Improved AI responses with direct references to specific figures and tables
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}