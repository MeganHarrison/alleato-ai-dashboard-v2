"use client";

import { PageHeader } from "@/components/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, FileText, MessageCircle } from "lucide-react";
import FMGlobalDataTables from "@/components/asrs/fm-global-data-tables";
import FMGlobalForm from "@/components/asrs/fm-global-form";
import FMGlobalChatInterface from "@/components/asrs/fm-global-chat-interface";

export default function FMGlobalDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="FM Global Dashboard"
        description="FM Global 8-34 ASRS Sprinkler System Resources and Tools"
      />

      <Tabs defaultValue="figures-tables" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="figures-tables" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Figures and Tables
          </TabsTrigger>
          <TabsTrigger value="form" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            FM Global Form
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        {/* Figures and Tables Tab */}
        <TabsContent value="figures-tables" className="space-y-6">
          <FMGlobalDataTables />
        </TabsContent>

        {/* FM Global Form Tab */}
        <TabsContent value="form" className="space-y-6">
          <FMGlobalForm />
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <FMGlobalChatInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}