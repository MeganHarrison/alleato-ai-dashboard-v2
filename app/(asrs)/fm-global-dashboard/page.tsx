"use client";

import React from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText, Database } from "lucide-react";
import Link from "next/link";
import FMGlobalTablesFigures from "@/components/asrs/fm-global-tables-figures";

export default function FMGlobalDashboard(): React.ReactElement {
  return (
    <div className="mx-auto p-4 lg:p-6 space-y-6">
      <PageHeader
        title="FM Global Dashboard"
        description="Comprehensive FM Global resource center with chat interface, forms, tables, and figures"
      />

      {/* Main Action Cards */}
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
            <Button className="w-full" asChild>
              <Link href="/fm-global-expert">
                Start Conversation
              </Link>
            </Button>
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
            <Button className="w-full" variant="outline" asChild>
              <Link href="/fm-global-form">
                Open Requirements Form
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Browse All Tables & Figures
            </CardTitle>
            <CardDescription>
              Access the complete database view with advanced filtering and detailed information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline" asChild>
              <Link href="/fm-global-tables">
                Full Database View
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Integrated Tables & Figures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            FM Global Tables & Figures
          </CardTitle>
          <CardDescription>
            Browse and search through FM Global reference tables and figures directly from the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FMGlobalTablesFigures />
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Navigation</CardTitle>
          <CardDescription>
            Jump to other ASRS resources and tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/asrs-dashboard">
                Return to Main ASRS Dashboard
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/asrs-design">
                ASRS Design Tools
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}