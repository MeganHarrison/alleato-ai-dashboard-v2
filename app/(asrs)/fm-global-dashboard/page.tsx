"use client";

import React from 'react';
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Settings, FileText } from "lucide-react";
import Link from "next/link";

export default function ASRSMainChat() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ASRS Main Chat"
        description="General ASRS consultation for system design, project planning, and technical guidance"
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Start Chat
            </CardTitle>
            <CardDescription>
              Get instant answers about ASRS sprinkler systems, compliance requirements, and design specifications.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/fm-global-expert">
              <Button className="w-full">
                Open FM Global Expert Chat
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
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>
            Jump directly to commonly used resources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Link href="/fm-global-tables">
              <Button variant="outline" className="w-full justify-start">
                Browse Tables & Figures
              </Button>
            </Link>
            <Link href="/asrs-dashboard">
              <Button variant="outline" className="w-full justify-start">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}