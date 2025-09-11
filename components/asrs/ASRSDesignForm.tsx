"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  ChevronRightIcon,
  ArrowDownTrayIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";

// Types
interface FormData {
  project_name: string;
  company_name: string;
  contact_email: string;
  location: string;
  description: string;
  asrs_type: "mini_load" | "shuttle" | "top_loading" | "";
  storage_height_ft: number | null;
  ceiling_height_ft: number | null;
  rack_row_depth_ft: number | null;
  main_aisle_width_ft: number | null;
  transverse_flue_space_in: number;
  container_type:
    | "noncombustible_closed"
    | "combustible_closed"
    | "combustible_open"
    | "expanded_plastic"
    | "";
  commodity_class:
    | "class_1"
    | "class_2"
    | "class_3"
    | "class_4"
    | "plastic_cartoned"
    | "plastic_uncartoned"
    | "";
  container_height_in: number | null;
  container_length_in: number | null;
  container_width_in: number | null;
  system_type: "wet" | "dry";
  building_temperature:
    | "ambient"
    | "heated"
    | "unheated"
    | "freezer"
    | "cooler";
  water_pressure_psi: number | null;
  water_flow_gpm: number | null;
  special_hazards: string[];
}

interface Step {
  title: string;
  description: string;
}

interface ASRSType {
  value: string;
  name: string;
  description: string;
}

interface ContainerType {
  value: string;
  name: string;
  description: string;
  cost_impact?: string;
}

interface CommodityClass {
  value: string;
  name: string;
  description: string;
}

interface SpecialHazard {
  value: string;
  name: string;
}

interface Recommendation {
  id: number;
  priority: "critical" | "high" | "medium";
  title: string;
  description: string;
  savings: number;
}

interface Results {
  protection_scheme: string;
  fm_table: string;
  ceiling_sprinklers: string;
  estimated_cost: number;
  recommendations: Recommendation[];
}

const ASRSDesignForm: React.FC = () => {
  const [currentStep] = useState($2);
  const [isCalculating] = useState($2);
  const [hasResults] = useState($2);
  const steps: Step[] = [
    { title: "Project Info", description: "Basic project details" },
    { title: "ASRS Config", description: "System configuration" },
    { title: "Containers", description: "Container & commodity" },
    { title: "Requirements", description: "System requirements" },
    { title: "Results", description: "Design & recommendations" },
  ];

  const [formData, setFormData] = useState<FormData>({
    project_name: "",
    company_name: "",
    contact_email: "",
    location: "",
    description: "",
    asrs_type: "",
    storage_height_ft: null,
    ceiling_height_ft: null,
    rack_row_depth_ft: null,
    main_aisle_width_ft: null,
    transverse_flue_space_in: 3.0,
    container_type: "",
    commodity_class: "",
    container_height_in: null,
    container_length_in: null,
    container_width_in: null,
    system_type: "wet",
    building_temperature: "ambient",
    water_pressure_psi: null,
    water_flow_gpm: null,
    special_hazards: [],
  });

  const [results, setResults] = useState<Results>({
    protection_scheme: "",
    fm_table: "",
    ceiling_sprinklers: "",
    estimated_cost: 0,
    recommendations: [],
  });

  const asrsTypes: ASRSType[] = [
    {
      value: "mini_load",
      name: "Mini-Load ASRS",
      description: "Uses angle irons/guides for container support",
    },
    {
      value: "shuttle",
      name: "Shuttle ASRS",
      description: "Uses slats/mesh shelving without guides",
    },
    {
      value: "top_loading",
      name: "Top-Loading ASRS",
      description: "Robot access from above on grid",
    },
  ];

  const containerTypes: ContainerType[] = [
    {
      value: "noncombustible_closed",
      name: "Noncombustible Closed-Top",
      description: "Metal containers with closed tops",
      cost_impact: "Lowest sprinkler requirements",
    },
    {
      value: "combustible_closed",
      name: "Combustible Closed-Top",
      description: "Cardboard/plastic containers with closed tops",
    },
    {
      value: "combustible_open",
      name: "Combustible Open-Top",
      description: "Cardboard/plastic containers with open tops",
      cost_impact: "Requires in-rack sprinklers",
    },
    {
      value: "expanded_plastic",
      name: "Expanded Plastic",
      description: "Foam containers (special requirements)",
      cost_impact: "Highest protection requirements",
    },
  ];

  const commodityClasses: CommodityClass[] = [
    {
      value: "class_1",
      name: "Class 1",
      description: "Noncombustible products",
    },
    {
      value: "class_2",
      name: "Class 2",
      description: "Noncombustible in combustible packaging",
    },
    { value: "class_3", name: "Class 3", description: "Combustible products" },
    {
      value: "class_4",
      name: "Class 4",
      description: "Limited plastic content",
    },
    {
      value: "plastic_cartoned",
      name: "Cartoned Plastic",
      description: "Plastic products in boxes",
    },
    {
      value: "plastic_uncartoned",
      name: "Uncartoned Plastic",
      description: "Plastic products direct",
    },
  ];

  const specialHazards: SpecialHazard[] = [
    { value: "ignitable_liquids", name: "Ignitable Liquids" },
    { value: "aerosols", name: "Aerosols" },
    { value: "lithium_batteries", name: "Lithium-Ion Batteries" },
    { value: "high_value_items", name: "High-Value Items" },
  ];

  const updateFormData = useCallback((field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleSpecialHazard = useCallback((hazard: string) => {
    setFormData((prev) => ({
      ...prev,
      special_hazards: prev.special_hazards.includes(hazard)
        ? prev.special_hazards.filter((h) => h !== hazard)
        : [...prev.special_hazards, hazard],
    }));
  }, []);

  const canProceed = useCallback((): boolean => {
    switch (currentStep) {
      case 0: // Project Info
        return !!(
          formData.project_name &&
          formData.company_name &&
          formData.contact_email
        );
      case 1: // ASRS Config
        return !!(
          formData.asrs_type &&
          formData.storage_height_ft &&
          formData.ceiling_height_ft
        );
      case 2: // Containers
        return !!(formData.container_type && formData.commodity_class);
      case 3: // Requirements
        return !!formData.system_type;
      default:
        return true;
    }
  }, [currentStep, formData]);

  const generateMockResults = useCallback((): Results => {
    const results: Results = {
      protection_scheme: "Ceiling-Only Protection",
      fm_table: "Table 27 (Mini-Load Wet System)",
      ceiling_sprinklers: "16 @ 15 psi (K25.2)",
      estimated_cost: 285000,
      recommendations: [],
    };

    // Generate recommendations based on configuration
    if (formData.storage_height_ft && formData.storage_height_ft > 20) {
      results.recommendations.push({
        id: 1,
        priority: "critical",
        title: "Storage Height Optimization",
        description: `Reducing storage height from ${formData.storage_height_ft}ft to 20ft eliminates enhanced protection requirements`,
        savings: 125000,
      });
    }

    if (formData.container_type === "combustible_open") {
      results.recommendations.push({
        id: 2,
        priority: "high",
        title: "Container Type Upgrade",
        description:
          "Switching to closed-top containers eliminates need for in-rack sprinklers",
        savings: 180000,
      });
      results.protection_scheme = "Ceiling + In-Rack Protection";
      results.estimated_cost += 200000;
    }

    if (
      formData.system_type === "dry" &&
      formData.building_temperature === "heated"
    ) {
      results.recommendations.push({
        id: 3,
        priority: "medium",
        title: "System Type Optimization",
        description:
          "Wet system possible in heated building, reduces sprinkler count by 25%",
        savings: 45000,
      });
    }

    return results;
  }, [formData]);

  const calculateRequirements = useCallback(async () => {
    setIsCalculating(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));

    const mockResults = generateMockResults();
    setResults(mockResults);
    setHasResults(true);
    setIsCalculating(false);

    // Track lead (would integrate with actual CRM)
    trackLead(mockResults);
  }, [generateMockResults]);

  const trackLead = useCallback(
    async (results: Results) => {
      const score = 0;
      if (formData.storage_height_ft && formData.storage_height_ft > 15)
        score += 25;
      if (formData.container_type.includes("combustible")) score += 30;
      if (results.estimated_cost > 200000) score += 45;

      const leadData = {
        ...formData,
        results,
        lead_score: score,
        estimated_value: results.estimated_cost,
        timestamp: new Date().toISOString(),
      };

      console.log("High-value lead detected:", leadData);
      // Would integrate with CRM/notification system
    },
    [formData]
  );

  const nextStep = useCallback(async () => {
    if (currentStep === 3) {
      await calculateRequirements();
    }
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, calculateRequirements, steps.length]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const downloadReport = useCallback(() => {
    const reportData = {
      project: formData,
      requirements: results,
      timestamp: new Date().toLocaleDateString(),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.project_name.replace(
      /\s+/g,
      "_"
    )}_ASRS_Design_Report.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [formData, results]);

  return (
    <div className="min-h-screen">
      {/* Progress Indicator */}
      <div className="mx-auto px-4 py-6">
        <div className="flex items-center justify-start mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start">
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    currentStep === index
                      ? "bg-brand-500 text-white"
                      : currentStep > index
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {currentStep > index ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="w-12 h-0.5 bg-gray-200 mx-6" />
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="bg-gray-50 rounded-lg p-8">
          {/* Step 1: ASRS Configuration - Shows ASRS Config Fields */}
          {currentStep === 0 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                ASRS System Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.project_name}
                    onChange={(e) =>
                      updateFormData("project_name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., Warehouse Expansion Phase 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) =>
                      updateFormData("company_name", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      updateFormData("contact_email", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="your.email@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateFormData("location", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="City, State"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      updateFormData("description", e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Brief description of your ASRS warehouse project..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Container & Commodity - Shows Container Fields */}
          {currentStep === 1 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                ASRS System Configuration
              </h2>

              {/* ASRS Type Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  ASRS Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {asrsTypes.map((type) => (
                    <div key={type.value} className="relative">
                      <input
                        type="radio"
                        value={type.value}
                        checked={formData.asrs_type === type.value}
                        onChange={(e) =>
                          updateFormData("asrs_type", e.target.value)
                        }
                        id={`asrs_${type.value}`}
                        className="sr-only"
                      />
                      <label
                        htmlFor={`asrs_${type.value}`}
                        className={`block p-4 border-2 rounded-lg cursor-pointer hover:border-brand-300 transition-colors ${
                          formData.asrs_type === type.value
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {type.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {type.description}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Facility Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Storage Height (ft) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.storage_height_ft || ""}
                    onChange={(e) =>
                      updateFormData(
                        "storage_height_ft",
                        parseFloat(e.target.value) || null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., 25.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum height of stored materials
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ceiling Height (ft) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.ceiling_height_ft || ""}
                    onChange={(e) =>
                      updateFormData(
                        "ceiling_height_ft",
                        parseFloat(e.target.value) || null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., 32.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Building ceiling height
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rack Row Depth (ft)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.rack_row_depth_ft || ""}
                    onChange={(e) =>
                      updateFormData(
                        "rack_row_depth_ft",
                        parseFloat(e.target.value) || null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., 4.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Perpendicular to loading aisle
                  </p>
                </div>
              </div>

              {/* Aisle Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Main Aisle Width (ft)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.main_aisle_width_ft || ""}
                    onChange={(e) =>
                      updateFormData(
                        "main_aisle_width_ft",
                        parseFloat(e.target.value) || null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., 6.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transverse Flue Space (in)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.transverse_flue_space_in}
                    onChange={(e) =>
                      updateFormData(
                        "transverse_flue_space_in",
                        parseFloat(e.target.value) || 3.0
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., 3.0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 3 inches required
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: System Requirements - Shows System Fields */}
          {currentStep === 2 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Container & Commodity Information
              </h2>

              {/* Container Type */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Container Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {containerTypes.map((container) => (
                    <div key={container.value} className="relative">
                      <input
                        type="radio"
                        value={container.value}
                        checked={formData.container_type === container.value}
                        onChange={(e) =>
                          updateFormData("container_type", e.target.value)
                        }
                        id={`container_${container.value}`}
                        className="sr-only"
                      />
                      <label
                        htmlFor={`container_${container.value}`}
                        className={`block p-4 border-2 rounded-lg cursor-pointer hover:border-brand-300 transition-colors ${
                          formData.container_type === container.value
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {container.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {container.description}
                        </div>
                        {container.cost_impact && (
                          <div className="text-xs font-medium text-brand-600 mt-2">
                            {container.cost_impact}
                          </div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commodity Classification */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Commodity Classification *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {commodityClasses.map((commodity) => (
                    <div key={commodity.value} className="relative">
                      <input
                        type="radio"
                        value={commodity.value}
                        checked={formData.commodity_class === commodity.value}
                        onChange={(e) =>
                          updateFormData("commodity_class", e.target.value)
                        }
                        id={`commodity_${commodity.value}`}
                        className="sr-only"
                      />
                      <label
                        htmlFor={`commodity_${commodity.value}`}
                        className={`block p-3 border-2 rounded-lg cursor-pointer hover:border-brand-300 transition-colors ${
                          formData.commodity_class === commodity.value
                            ? "border-brand-500 bg-brand-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {commodity.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {commodity.description}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Container Dimensions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Height (in)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.container_height_in || ""}
                    onChange={(e) =>
                      updateFormData(
                        "container_height_in",
                        parseFloat(e.target.value) || null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., 15.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Length (in)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.container_length_in || ""}
                    onChange={(e) =>
                      updateFormData(
                        "container_length_in",
                        parseFloat(e.target.value) || null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., 24.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Container Width (in)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.container_width_in || ""}
                    onChange={(e) =>
                      updateFormData(
                        "container_width_in",
                        parseFloat(e.target.value) || null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g., 16.0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Project Information - Shows Project Fields */}
          {currentStep === 3 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                System Requirements
              </h2>

              {/* System Type */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Sprinkler System Type *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="radio"
                      value="wet"
                      checked={formData.system_type === "wet"}
                      onChange={(e) =>
                        updateFormData("system_type", e.target.value)
                      }
                      id="system_wet"
                      className="sr-only"
                    />
                    <label
                      htmlFor="system_wet"
                      className={`block p-4 border-2 rounded-lg cursor-pointer hover:border-brand-300 transition-colors ${
                        formData.system_type === "wet"
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        Wet System
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Water-filled pipes, fastest response
                      </div>
                      <div className="text-xs font-medium text-green-600 mt-2">
                        Lower sprinkler count required
                      </div>
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      type="radio"
                      value="dry"
                      checked={formData.system_type === "dry"}
                      onChange={(e) =>
                        updateFormData("system_type", e.target.value)
                      }
                      id="system_dry"
                      className="sr-only"
                    />
                    <label
                      htmlFor="system_dry"
                      className={`block p-4 border-2 rounded-lg cursor-pointer hover:border-brand-300 transition-colors ${
                        formData.system_type === "dry"
                          ? "border-brand-500 bg-brand-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        Dry System
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Air-filled pipes, freeze protection
                      </div>
                      <div className="text-xs font-medium text-orange-600 mt-2">
                        Higher sprinkler count required
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Environmental Conditions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Building Temperature
                  </label>
                  <select
                    value={formData.building_temperature}
                    onChange={(e) =>
                      updateFormData("building_temperature", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="ambient">Ambient (65-75°F)</option>
                    <option value="heated">Heated (&gt;40°F)</option>
                    <option value="unheated">Unheated (&lt;40°F)</option>
                    <option value="freezer">Freezer (&lt;32°F)</option>
                    <option value="cooler">Cooler (32-55°F)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Water Supply Available
                  </label>
                  <div className="flex items-center space-x-4">
                    <div>
                      <input
                        type="number"
                        step="1"
                        value={formData.water_pressure_psi || ""}
                        onChange={(e) =>
                          updateFormData(
                            "water_pressure_psi",
                            parseInt(e.target.value) || null
                          )
                        }
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="80"
                      />
                      <span className="text-sm text-gray-600 ml-2">psi @</span>
                    </div>
                    <div>
                      <input
                        type="number"
                        step="10"
                        value={formData.water_flow_gpm || ""}
                        onChange={(e) =>
                          updateFormData(
                            "water_flow_gpm",
                            parseInt(e.target.value) || null
                          )
                        }
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500"
                        placeholder="1500"
                      />
                      <span className="text-sm text-gray-600 ml-2">gpm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Considerations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Hazards (Check all that apply)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {specialHazards.map((hazard) => (
                    <label key={hazard.value} className="flex items-center">
                      <input
                        type="checkbox"
                        value={hazard.value}
                        checked={formData.special_hazards.includes(
                          hazard.value
                        )}
                        onChange={() => toggleSpecialHazard(hazard.value)}
                        className="rounded border-gray-300 text-brand-600 shadow-sm focus:border-brand-300 focus:ring focus:ring-brand-200"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        {hazard.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Results & Recommendations */}
          {currentStep === 4 && (
            <div className="animate-in fade-in duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Design Requirements & Recommendations
              </h2>

              {/* Loading State */}
              {isCalculating && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">
                    Analyzing your ASRS configuration...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Checking 47 FM Global 8-34 protection tables
                  </p>
                </div>
              )}

              {/* Results */}
              {!isCalculating && hasResults && (
                <div className="space-y-6">
                  {/* Primary Requirements */}
                  <div className="bg-brand-50 border border-brand-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-brand-900 mb-4 flex items-center">
                      🔥 Primary Protection Requirements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm text-gray-600">
                          Protection Scheme
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {results.protection_scheme}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm text-gray-600">
                          Applicable FM Table
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {results.fm_table}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm text-gray-600">
                          Ceiling Sprinklers
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          {results.ceiling_sprinklers}
                        </div>
                      </div>
                      <div className="bg-white p-4 rounded border">
                        <div className="text-sm text-gray-600">
                          Estimated System Cost
                        </div>
                        <div className="text-lg font-semibold text-gray-900">
                          ${results.estimated_cost.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Optimization Recommendations */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      💡 Cost Optimization Opportunities
                    </h3>
                    {results.recommendations.map((rec) => (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          rec.priority === "critical"
                            ? "border-red-500 bg-gradient-to-r from-red-50 to-red-100"
                            : rec.priority === "high"
                            ? "border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100"
                            : "border-green-500 bg-gradient-to-r from-green-50 to-green-100"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">
                                {rec.title}
                              </span>
                              <span
                                className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                  rec.priority === "critical"
                                    ? "bg-red-100 text-red-800"
                                    : rec.priority === "high"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {rec.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 mt-1">
                              {rec.description}
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <div className="text-lg font-bold text-green-600">
                              ${rec.savings.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              potential savings
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Next Steps */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      🚀 Next Steps
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          1
                        </div>
                        <span className="text-gray-800">
                          Download your detailed design specification report
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          2
                        </div>
                        <span className="text-gray-800">
                          Schedule a consultation with our ASRS sprinkler
                          experts
                        </span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                          3
                        </div>
                        <span className="text-gray-800">
                          Receive detailed hydraulic calculations and system
                          layout
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep > 0 && (
              <button
                onClick={previousStep}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                Previous
              </button>
            )}
            <div className="flex-1"></div>
            {currentStep < steps.length - 1 && (
              <button
                onClick={nextStep}
                disabled={!canProceed()}
                className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  canProceed()
                    ? "bg-brand-600 hover:bg-brand-700 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {currentStep < steps.length - 2
                  ? "Continue"
                  : "Get Design Requirements"}
              </button>
            )}
            {currentStep === steps.length - 1 && hasResults && (
              <button
                onClick={downloadReport}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Download Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ASRSDesignForm;
