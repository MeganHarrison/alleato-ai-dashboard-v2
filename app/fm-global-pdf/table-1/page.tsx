"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Calculator, Download, Info } from "lucide-react";
import { useState } from "react";

interface SprinklerData {
  sprinklersInDesign: number | string;
  sprinklerType: string;
  maxCeilingSlope: string;
  constructionType: string;
  onLineSpacing: string;
  sprinklersPerBranch: string | number;
}

export default function FMSprinklerTablePage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSlope, setFilterSlope] = useState<string>("all");
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null);

  const tableData: SprinklerData[] = [
    // 6 Sprinklers
    {
      sprinklersInDesign: 6,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "2 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: 3,
    },
    {
      sprinklersInDesign: 6,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Unobstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 6,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Obstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },

    // 8 Sprinklers
    {
      sprinklersInDesign: 8,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "1 in 12",
      constructionType: "Any",
      onLineSpacing: "≤ 12 (3.7)",
      sprinklersPerBranch: 4,
    },
    {
      sprinklersInDesign: 8,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "1 in 12",
      constructionType: "Any",
      onLineSpacing: "> 12 (3.7)",
      sprinklersPerBranch: 3,
    },
    {
      sprinklersInDesign: 8,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "2 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: 4,
    },
    {
      sprinklersInDesign: 8,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Unobstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 8,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Obstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },

    // 9 Sprinklers
    {
      sprinklersInDesign: 9,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "2 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: 3,
    },
    {
      sprinklersInDesign: 9,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Unobstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 9,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Obstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },
    {
      sprinklersInDesign: 9,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "2 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: 4,
    },
    {
      sprinklersInDesign: 9,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Unobstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 9,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Obstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },

    // 10 Sprinklers
    {
      sprinklersInDesign: 10,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "1 in 12",
      constructionType: "Any",
      onLineSpacing: "< 10 (3.0)",
      sprinklersPerBranch: 4,
    },
    {
      sprinklersInDesign: 10,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "1 in 12",
      constructionType: "Any",
      onLineSpacing: "≥ 10 (3.0)",
      sprinklersPerBranch: 3,
    },
    {
      sprinklersInDesign: 10,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "2 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: 4,
    },
    {
      sprinklersInDesign: 10,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Unobstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 10,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Obstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },
    {
      sprinklersInDesign: 10,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "1 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 10,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "2 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },
    {
      sprinklersInDesign: 10,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Unobstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 10,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Obstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },

    // 12 Sprinklers
    {
      sprinklersInDesign: 12,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "2 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: 4,
    },
    {
      sprinklersInDesign: 12,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Unobstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 12,
      sprinklerType: "Standard Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Obstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },
    {
      sprinklersInDesign: 12,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "1 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 12,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "2 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },
    {
      sprinklersInDesign: 12,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Unobstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: 12,
      sprinklerType: "Extended Coverage",
      maxCeilingSlope: "4 in 12",
      constructionType: "Obstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },

    // > 12 Sprinklers
    {
      sprinklersInDesign: "> 12",
      sprinklerType: "Any",
      maxCeilingSlope: "1 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: "> 12",
      sprinklerType: "Any",
      maxCeilingSlope: "2 in 12",
      constructionType: "Any",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },
    {
      sprinklersInDesign: "> 12",
      sprinklerType: "Any",
      maxCeilingSlope: "4 in 12",
      constructionType: "Unobstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 1",
    },
    {
      sprinklersInDesign: "> 12",
      sprinklerType: "Any",
      maxCeilingSlope: "4 in 12",
      constructionType: "Obstructed",
      onLineSpacing: "Any",
      sprinklersPerBranch: "See Equation 2",
    },
  ];

  const filteredData = tableData.filter((row) => {
    const typeMatch =
      filterType === "all" ||
      row.sprinklerType.toLowerCase().includes(filterType.toLowerCase());
    const slopeMatch =
      filterSlope === "all" || row.maxCeilingSlope === filterSlope;
    return typeMatch && slopeMatch;
  });

  const getSprinklerCountColor = (count: number | string) => {
    if (typeof count === "string") return "bg-purple-500";
    if (count <= 6) return "bg-green-500";
    if (count <= 9) return "bg-yellow-500";
    if (count <= 12) return "bg-orange-500";
    return "bg-red-500";
  };

  const getEquationBadge = (value: string | number) => {
    if (typeof value === "string" && value.includes("Equation")) {
      const eqNumber = value.includes("1") ? "1" : "2";
      return (
        <Badge
          variant="outline"
          className="bg-[#DB802D]/10 text-[#DB802D] border-[#DB802D]/30"
        >
          <Calculator className="h-3 w-3 mr-1" />
          Equation {eqNumber}
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="font-mono">
        {value}
      </Badge>
    );
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              Determining Number of Sprinklers per Branch Line for Ceiling
              Sprinkler System Hydraulic Design
            </h1>
            <p className="text-muted-foreground mt-1">Table 1</p>
          </div>
          <div className="flex gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p>
                    This table determines the number of sprinklers per branch
                    line based on ceiling design parameters for automatic
                    storage systems.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="standard">Standard Coverage</SelectItem>
            <SelectItem value="extended">Extended Coverage</SelectItem>
            <SelectItem value="any">Any Type</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterSlope} onValueChange={setFilterSlope}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by slope" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Slopes</SelectItem>
            <SelectItem value="1 in 12">1 in 12</SelectItem>
            <SelectItem value="2 in 12">2 in 12</SelectItem>
            <SelectItem value="4 in 12">4 in 12</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFilterType("all");
            setFilterSlope("all");
          }}
        >
          Clear Filters
        </Button>
      </div>

      {/* Main Table */}
      <div className="overflow-auto h-full">
        <table className="w-full">
          <thead className="sticky top-0 bg-background border-b text-xs">
            <tr>
              <th className="text-left p-4 font-medium">
                <div className="flex items-center gap-2">
                  Sprinklers in Ceiling Design
                </div>
              </th>
              <th className="text-left p-4 font-medium">
                <div className="flex items-center gap-2">
                  Ceiling Sprinkler Type
                </div>
              </th>
              <th className="text-left p-4 font-medium">
                <div className="flex items-center gap-2">Max Ceiling Slope</div>
              </th>
              <th className="text-left p-4 font-medium">
                Ceiling Construction Type
              </th>
              <th className="text-left p-4 font-medium">On-Line Spacing</th>
              <th className="text-left p-4 font-medium">
                <div className="flex items-center gap-2">
                  Sprinklers per Branch
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, index) => (
              <tr
                key={index}
                className={`border-b transition-all hover:bg-muted/50 ${
                  highlightedRow === index ? "bg-[#DB802D]/5" : ""
                }`}
                onMouseEnter={() => setHighlightedRow(index)}
                onMouseLeave={() => setHighlightedRow(null)}
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold ${getSprinklerCountColor(
                        row.sprinklersInDesign
                      )}`}
                    >
                      {row.sprinklersInDesign}
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <Badge
                    variant={
                      row.sprinklerType === "Extended Coverage"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {row.sprinklerType}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-6 bg-secondary rounded relative overflow-hidden">
                      <div
                        className="absolute bottom-0 left-0 w-full bg-[#DB802D]/30 origin-bottom-left"
                        style={{
                          height: "100%",
                          transform: `rotate(-${
                            row.maxCeilingSlope === "1 in 12"
                              ? 5
                              : row.maxCeilingSlope === "2 in 12"
                              ? 10
                              : 20
                          }deg)`,
                        }}
                      />
                    </div>
                    <span className="font-medium text-sm">
                      {row.maxCeilingSlope}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <Badge
                    variant="outline"
                    className={
                      row.constructionType === "Obstructed"
                        ? "border-red-500/50 text-red-600"
                        : ""
                    }
                  >
                    {row.constructionType}
                  </Badge>
                </td>
                <td className="p-4">
                  <span className="font-mono text-sm">{row.onLineSpacing}</span>
                </td>
                <td className="p-4">
                  {getEquationBadge(row.sprinklersPerBranch)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mt-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Configurations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableData.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique scenarios
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Coverage Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">
              Standard & Extended
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Max Slope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4 in 12</div>
            <p className="text-xs text-muted-foreground mt-1">
              Maximum ceiling slope
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Equations Used
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">
              Calculation methods
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Footer Notes */}
      <div className="mt-4 flex gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#DB802D]" />
              Equation 1
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              For unobstructed construction or slopes ≤ 2 in 12
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calculator className="h-4 w-4 text-[#DB802D]" />
              Equation 2
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              For obstructed construction or higher slopes
            </p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              Important Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Values in meters shown in parentheses
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
