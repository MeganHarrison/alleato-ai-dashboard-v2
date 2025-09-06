"use client";
import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Calculator,
  FileText,
  Zap,
  Users,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  DollarSign,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

// Mock data based on your CSV structure
const mockTables = [
  {
    id: "table_1",
    table_number: 1,
    title: "Branch Line Calculations",
    asrs_type: "All",
    system_type: "both",
    protection_scheme: "ceiling_only",
    complexity_score: 8,
    description:
      "Determining number of sprinklers per branch line for ceiling sprinkler system hydraulic design",
    key_parameters: ["Ceiling Slope", "Sprinkler Spacing", "Coverage Type"],
    estimated_cost_impact: "low",
    page_number: 11,
  },
  {
    id: "table_14",
    table_number: 14,
    title: "Shuttle IRAS Arrangements",
    asrs_type: "shuttle",
    system_type: "wet_or_dry",
    protection_scheme: "in_rack_with_ceiling",
    complexity_score: 9,
    description:
      "In-rack automatic sprinkler arrangements for shuttle ASRS systems",
    key_parameters: ["Rack Depth", "Container Type", "Flue Spaces"],
    estimated_cost_impact: "high",
    page_number: 45,
  },
  {
    id: "table_15",
    table_number: 15,
    title: "Shuttle Wet IRAS Designs",
    asrs_type: "shuttle",
    system_type: "wet",
    protection_scheme: "in_rack_with_ceiling",
    complexity_score: 7,
    description: "Wet system design parameters for shuttle in-rack sprinklers",
    key_parameters: ["Storage Height", "Commodity Class", "Flow Density"],
    estimated_cost_impact: "high",
    page_number: 47,
  },
  {
    id: "table_26",
    table_number: 26,
    title: "Mini-Load Decision Matrix",
    asrs_type: "mini_load",
    system_type: "both",
    protection_scheme: "unknown",
    complexity_score: 5,
    description: "Decision matrix for mini-load ASRS protection requirements",
    key_parameters: ["Container Type", "Storage Height", "Commodity"],
    estimated_cost_impact: "medium",
    page_number: 65,
  },
  {
    id: "table_32",
    table_number: 32,
    title: "Mini-Load Wet IRAS Designs",
    asrs_type: "mini_load",
    system_type: "wet",
    protection_scheme: "in_rack_with_ceiling",
    complexity_score: 8,
    description: "Wet in-rack sprinkler designs for mini-load systems",
    key_parameters: [
      "Rack Configuration",
      "Sprinkler K-factor",
      "Design Density",
    ],
    estimated_cost_impact: "high",
    page_number: 71,
  },
  {
    id: "table_4",
    table_number: 4,
    title: "Shuttle Wet Class I-III",
    asrs_type: "shuttle",
    system_type: "wet",
    protection_scheme: "ceiling_only",
    complexity_score: 6,
    description:
      "Wet ceiling sprinkler protection for shuttle ASRS with Class I-III commodities",
    key_parameters: ["Ceiling Height", "Storage Height", "Sprinkler Type"],
    estimated_cost_impact: "medium",
    page_number: 23,
  },
];

const mockFigures = [
  {
    figure_number: 1,
    title: "Navigation Flowchart",
    figure_type: "Navigation/Decision Tree",
    description: "Step-by-step guidance through FM Global 8-34 requirements",
    related_tables: ["all"],
  },
  {
    figure_number: 4,
    title: "Shuttle ASRS - 3 ft Depth, 2.5 ft Spacing",
    figure_type: "Sprinkler Layout",
    description: "Horizontal sprinkler arrangement for closed-top containers",
    related_tables: ["table_14", "table_15"],
  },
];

const FMGlobalDocsApp = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedASRSType, setSelectedASRSType] = useState("all");
  const [selectedSystemType, setSelectedSystemType] = useState("all");
  const [selectedComplexity, setSelectedComplexity] = useState("all");
  const [expandedTable, setExpandedTable] = useState(null);
  const [showCalculator, setShowCalculator] = useState(false);

  // Filter tables based on current selections
  const filteredTables = useMemo(() => {
    return mockTables.filter((table) => {
      const matchesSearch =
        table.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        table.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesASRS =
        selectedASRSType === "all" || table.asrs_type === selectedASRSType;
      const matchesSystem =
        selectedSystemType === "all" ||
        table.system_type === selectedSystemType ||
        table.system_type === "both";
      const matchesComplexity =
        selectedComplexity === "all" ||
        (selectedComplexity === "simple" && table.complexity_score <= 5) ||
        (selectedComplexity === "moderate" &&
          table.complexity_score > 5 &&
          table.complexity_score <= 7) ||
        (selectedComplexity === "complex" && table.complexity_score > 7);

      return matchesSearch && matchesASRS && matchesSystem && matchesComplexity;
    });
  }, [searchTerm, selectedASRSType, selectedSystemType, selectedComplexity]);

  const getComplexityColor = (score: number) => {
    if (score <= 5) return "text-green-600 bg-green-50";
    if (score <= 7) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getComplexityLabel = (score: number) => {
    if (score <= 5) return "Simple";
    if (score <= 7) return "Moderate";
    return "Complex";
  };

  const getCostImpactColor = (impact: string) => {
    switch (impact) {
      case "low":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "high":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const TableCard = ({ table }: { table: any }) => {
    const isExpanded = expandedTable === table.id;

    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded">
                  Table {table.table_number}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${getComplexityColor(
                    table.complexity_score
                  )}`}
                >
                  {getComplexityLabel(table.complexity_score)}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${getCostImpactColor(
                    table.estimated_cost_impact
                  )}`}
                >
                  {table.estimated_cost_impact.toUpperCase()} COST
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {table.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3">{table.description}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {table.asrs_type.replace("_", "-").toUpperCase()}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {table.system_type.replace("_", " ").toUpperCase()}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {table.protection_scheme.replace("_", " ").toUpperCase()}
                </span>
              </div>

              <div className="text-sm text-gray-500">
                <strong>Key Parameters:</strong>{" "}
                {table.key_parameters.join(", ")}
              </div>
            </div>

            <button
              onClick={() => setExpandedTable(isExpanded ? null : table.id)}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    System Requirements
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Ceiling Height: 20-45 ft</li>
                    <li>• Storage Height: Variable</li>
                    <li>• Sprinkler K-factor: 11.2</li>
                    <li>• Design Density: 0.30 gpm/sq ft</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Cost Optimization
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-green-600" />
                      Reduce spacing → Save 25%
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
                      Complex installation required
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCalculator(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {/* @ts-ignore */}
                  <div className="w-4 h-4">📱</div>
                  Use Calculator
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <FileText className="w-4 h-4" />
                  View Full Table
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  Page {table.page_number}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Calculator = () => {
    const [inputs, setInputs] = useState({
      rackDepth: "",
      ceilingHeight: "",
      containerType: "closed-top",
      commodityClass: "class-1",
    });

    const [results, setResults] = useState<{
      sprinklerCount: number;
      flowRate: number;
      estimatedCost: number;
      applicableTable: string;
      recommendations: Array<{
        type: string;
        text: string;
        savings?: string;
        status?: string;
      }>;
    } | null>(null);

    const calculateRequirements = () => {
      // Mock calculation based on inputs
      const sprinklerCount = Math.ceil(
        (parseFloat(inputs.rackDepth || "0") *
          parseFloat(inputs.ceilingHeight || "0")) /
          100
      );
      const flowRate = sprinklerCount * 25; // GPM per sprinkler
      const estimatedCost = sprinklerCount * 450; // Cost per sprinkler installed

      setResults({
        sprinklerCount,
        flowRate,
        estimatedCost,
        applicableTable: "Table 14",
        recommendations: [
          {
            type: "optimization",
            text: "Consider reducing rack depth by 1 ft to save $3,200",
            savings: "15%",
          },
          {
            type: "compliance",
            text: "Meets FM Global 8-34 requirements",
            status: "good",
          },
        ],
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">
                ASRS Sprinkler Calculator
              </h2>
              <button
                onClick={() => setShowCalculator(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-4">System Parameters</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rack Depth (ft)
                    </label>
                    <input
                      type="number"
                      value={inputs.rackDepth}
                      onChange={(e) =>
                        setInputs({ ...inputs, rackDepth: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="6"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ceiling Height (ft)
                    </label>
                    <input
                      type="number"
                      value={inputs.ceilingHeight}
                      onChange={(e) =>
                        setInputs({ ...inputs, ceilingHeight: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="30"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Container Type
                    </label>
                    <select
                      value={inputs.containerType}
                      onChange={(e) =>
                        setInputs({ ...inputs, containerType: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="closed-top">Closed-Top</option>
                      <option value="open-top">Open-Top</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Commodity Class
                    </label>
                    <select
                      value={inputs.commodityClass}
                      onChange={(e) =>
                        setInputs({ ...inputs, commodityClass: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="class-1">Class I</option>
                      <option value="class-2">Class II</option>
                      <option value="class-3">Class III</option>
                      <option value="class-4">Class IV</option>
                    </select>
                  </div>

                  <button
                    onClick={calculateRequirements}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Calculate Requirements
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-4">Results</h3>
                {results ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {results.sprinklerCount}
                      </div>
                      <div className="text-sm text-gray-600">
                        Sprinklers Required
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">
                        {results.flowRate} GPM
                      </div>
                      <div className="text-sm text-gray-600">
                        Flow Rate Required
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        ${results.estimatedCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">
                        Estimated Cost
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <div className="space-y-2">
                        {results.recommendations.map((rec, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-sm"
                          >
                            {rec.type === "optimization" ? (
                              <DollarSign
                                className="w-4 h-4 text-green-600 mt-0.5"
                              />
                            ) : (
                              <CheckCircle
                                className="w-4 h-4 text-blue-600 mt-0.5"
                              />
                            )}
                            <span>{rec.text}</span>
                            {rec.savings && (
                              <span className="text-green-600 font-medium">
                                ({rec.savings})
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        Get Expert Quote
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-8">
                    Enter parameters above to calculate requirements
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  FM Global 8-34
                </h1>
                <p className="text-sm text-gray-500">
                  ASRS Sprinkler Requirements
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowCalculator(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <div className="w-4 h-4">📱</div>
                Calculator
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Users className="w-4 h-4" />
                Contact Expert
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "tables", label: "Tables" },
              { id: "figures", label: "Figures" },
              { id: "calculator", label: "Calculator" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Navigate FM Global 8-34 with Confidence
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Interactive documentation and automated calculations for ASRS
                sprinkler system design and compliance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <FileText className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">36 Tables</h3>
                <p className="text-gray-600">
                  Complete requirements for all ASRS types with interactive
                  filtering and search.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="text-5xl text-green-600 mb-4">🧮</div>
                <h3 className="text-lg font-semibold mb-2">Smart Calculator</h3>
                <p className="text-gray-600">
                  Instant calculations for sprinkler counts, flow rates, and
                  cost estimates.
                </p>
              </div>

              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <DollarSign className="h-12 w-12 text-purple-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Cost Optimization
                </h3>
                <p className="text-gray-600">
                  AI-powered suggestions to reduce costs while maintaining
                  compliance.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Quick Start
              </h3>
              <p className="text-blue-800 mb-4">
                Get started with your ASRS project in 3 simple steps:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>
                  Browse tables by ASRS type (Shuttle, Mini-Load, Top-Loading)
                </li>
                <li>
                  Use the calculator to determine requirements for your specific
                  configuration
                </li>
                <li>
                  Contact our experts for detailed design and installation
                  support
                </li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === "tables" && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
                    />
                    <input
                      type="text"
                      placeholder="Search tables by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <select
                    value={selectedASRSType}
                    onChange={(e) => setSelectedASRSType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All ASRS Types</option>
                    <option value="shuttle">Shuttle</option>
                    <option value="mini_load">Mini-Load</option>
                    <option value="top_loading">Top-Loading</option>
                  </select>

                  <select
                    value={selectedSystemType}
                    onChange={(e) => setSelectedSystemType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Systems</option>
                    <option value="wet">Wet</option>
                    <option value="dry">Dry</option>
                  </select>

                  <select
                    value={selectedComplexity}
                    onChange={(e) => setSelectedComplexity(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Complexity</option>
                    <option value="simple">Simple</option>
                    <option value="moderate">Moderate</option>
                    <option value="complex">Complex</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results Summary */}
            <div className="text-sm text-gray-600">
              Showing {filteredTables.length} of {mockTables.length} tables
            </div>

            {/* Table Cards */}
            <div className="space-y-4">
              {filteredTables.map((table) => (
                <TableCard key={table.id} table={table} />
              ))}
            </div>

            {filteredTables.length === 0 && (
              <div className="text-center py-12">
                <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tables found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "figures" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Figures & Diagrams</h2>
              <p className="text-gray-600 mb-6">
                Visual references for ASRS sprinkler layouts and system
                configurations.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {mockFigures.map((figure) => (
                  <div
                    key={figure.figure_number}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-purple-100 text-purple-800 text-sm font-semibold px-2.5 py-0.5 rounded">
                        Figure {figure.figure_number}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {figure.figure_type}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {figure.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {figure.description}
                    </p>
                    <div className="bg-gray-100 h-32 rounded flex items-center justify-center text-gray-500">
                      [Figure Diagram]
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "calculator" && (
          <div className="space-y-6">
            <Calculator />
          </div>
        )}
      </main>

      {/* Calculator Modal */}
      {showCalculator && <Calculator />}
    </div>
  );
};

export default FMGlobalDocsApp;
