"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FMGlobalChatInterface from "@/components/asrs/fm-global-chat-interface";
import FMGlobalForm from "@/components/asrs/fm-global-form";
import FMGlobalTables from "@/components/asrs/fm-global-tables";
import { 
  Table2, 
  FileSpreadsheet,
  Plus
} from "lucide-react";

export default function FMGlobalPage() {
  const [activeTab] = useState($2);
  const [isFormOpen] = useState($2);
  return (
    <div className="h-[calc(100vh-120px)]">
      {/* Header with Form Button */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">FM Global ASRS</h1>
          <p className="text-muted-foreground">Compliance management system</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Submit Requirements
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>FM Global ASRS Requirements Form</DialogTitle>
              <DialogDescription>
                Submit your ASRS project requirements for FM Global compliance review
              </DialogDescription>
            </DialogHeader>
            <FMGlobalForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Split Layout - Chat Left, Tables/Figures Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100%-80px)]">
        
        {/* Left Side - Chat Interface */}
        <FMGlobalChatInterface />

        {/* Right Side - Tables and Figures */}
        <Card className="h-full flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <TabsList className="w-full">
                <TabsTrigger value="tables" className="flex-1">
                  <Table2 className="h-4 w-4 mr-2" />
                  Tables
                </TabsTrigger>
                <TabsTrigger value="figures" className="flex-1">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Figures
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-auto">
              <TabsContent value="tables" className="h-full m-0">
                <FMGlobalTables />
              </TabsContent>
              
              <TabsContent value="figures" className="h-full m-0">
                <FMGlobalFigures />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}

// Figures Component with Key Metrics
function FMGlobalFigures() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Storage Capacity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Storage Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10,000</div>
            <p className="text-xs text-muted-foreground">Total pallet positions</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilization</span>
                <span className="font-medium">72%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-[#DB802D] h-2 rounded-full transition-all" style={{ width: '72%' }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fire Protection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fire Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">ESFR coverage</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zones</span>
                <span className="font-medium">12/12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Inspection</span>
                <span className="font-medium">Jan 2024</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seismic Rating */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Seismic Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SDC D</div>
            <p className="text-xs text-muted-foreground">Design category</p>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Shear</span>
                <span className="font-medium">0.185</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Response Mod</span>
                <span className="font-medium">R=4.0</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environmental */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Temperature</span>
                  <span className="font-medium">68°F</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '40%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Humidity</span>
                  <span className="font-medium">45%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '50%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Throughput</span>
              <p className="text-lg font-semibold mt-1">100 pallets/hr</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Max Load</span>
              <p className="text-lg font-semibold mt-1">2,500 lbs</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Rack Height</span>
              <p className="text-lg font-semibold mt-1">40 ft</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Aisle Width</span>
              <p className="text-lg font-semibold mt-1">5 ft</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}