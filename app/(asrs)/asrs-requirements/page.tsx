"use client";

import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface FormData {
  // Facility Information
  buildingType: string;
  ceilingHeight: number;
  floorDrainage: string;
  waterSupplyPressure: number;
  waterSupplyFlow: number;

  // ASRS System Configuration
  asrsType: string;
  storageLength: number;
  storageWidth: number;
  storageHeight: number;
  numberOfLevels: number;
  aisleWidth: number;

  // Rack Structure Details
  rackRowDepth: number;
  rackUprightSpacing: number;
  tierHeight: number;
  transverseFlueWidth: number;
  longitudinalFlueWidth: number;
  supportType: string;

  // Container/Product Information
  containerMaterial: string;
  containerConfiguration: string;
  containerDimensions: {
    length: number;
    width: number;
    height: number;
  };
  commodityClass: string;
  specialHazards: string[];

  // Environmental Conditions
  ambientTemp: string;
  ventilation: string;
  seismicZone: string;
}

const ASRSRequirementsForm: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    buildingType: "",
    ceilingHeight: 0,
    floorDrainage: "",
    waterSupplyPressure: 0,
    waterSupplyFlow: 0,
    asrsType: "",
    storageLength: 0,
    storageWidth: 0,
    storageHeight: 0,
    numberOfLevels: 0,
    aisleWidth: 0,
    rackRowDepth: 0,
    rackUprightSpacing: 0,
    tierHeight: 0,
    transverseFlueWidth: 0,
    longitudinalFlueWidth: 0,
    supportType: "",
    containerMaterial: "",
    containerConfiguration: "",
    containerDimensions: { length: 0, width: 0, height: 0 },
    commodityClass: "",
    specialHazards: [],
    ambientTemp: "",
    ventilation: "",
    seismicZone: "",
  });

  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [potentialSavings, setPotentialSavings] = useState<number>(0);

  const steps = [
    "Facility Information",
    "ASRS Configuration",
    "Rack Structure",
    "Container Details",
    "Environment",
    "Review & Recommendations",
  ];

  // Cost optimization logic
  useEffect(() => {
    const newRecommendations: string[] = [];
    let savings = 0;

    // Open-top to closed-top analysis
    if (
      formData.containerConfiguration === "open-top" &&
      ["Class 2", "Class 3", "Class 4"].includes(formData.commodityClass)
    ) {
      newRecommendations.push(
        "💡 Switch to closed-top containers to eliminate in-rack sprinklers"
      );
      savings += 15000;
    }

    // Rack depth optimization
    if (formData.rackRowDepth > 6) {
      newRecommendations.push(
        "💡 Reduce rack depth to ≤6 ft to lower pressure requirements"
      );
      savings += 8000;
    }

    // Storage height threshold
    if (formData.storageHeight > 20 && formData.storageHeight <= 25) {
      newRecommendations.push(
        "💡 Reduce storage height to ≤20 ft to avoid enhanced protection"
      );
      savings += 12000;
    }

    // Aisle width optimization
    if (formData.aisleWidth < 6) {
      newRecommendations.push(
        "⚠️ Increase aisle width to ≥8 ft for better water penetration"
      );
    }

    // Noncombustible container benefits
    if (formData.containerMaterial === "noncombustible") {
      newRecommendations.push(
        "✅ Noncombustible containers reduce sprinkler requirements significantly"
      );
    }

    setRecommendations(newRecommendations);
    setPotentialSavings(savings);
  }, [formData]);

  const updateFormData = (field: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateNestedFormData = (
    parent: string,
    field: string,
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...((prev[parent as keyof FormData] as Record<string, unknown>) || {}),
        [field]: value,
      },
    }));
  };

  const handleSpecialHazardChange = (hazard: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      specialHazards: checked
        ? [...prev.specialHazards, hazard]
        : prev.specialHazards.filter((h) => h !== hazard),
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0: // Facility Information
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Building Construction Type
                </label>
                <select
                  value={formData.buildingType}
                  onChange={(e) =>
                    updateFormData("buildingType", e.target.value)
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="noncombustible">Noncombustible</option>
                  <option value="limited-combustible">
                    Limited Combustible
                  </option>
                  <option value="combustible">Combustible</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Ceiling Height (ft)
                </label>
                <input
                  type="number"
                  value={formData.ceilingHeight || ""}
                  onChange={(e) =>
                    updateFormData("ceilingHeight", parseFloat(e.target.value))
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 32"
                />
                {formData.ceilingHeight > 55 && (
                  <p className="text-amber-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Heights &gt;55 ft may have limited configuration options
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Floor Drainage Capacity
                </label>
                <select
                  value={formData.floorDrainage}
                  onChange={(e) =>
                    updateFormData("floorDrainage", e.target.value)
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select capacity</option>
                  <option value="adequate">Adequate (per FM Global)</option>
                  <option value="limited">Limited</option>
                  <option value="none">None</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Water Supply Pressure (psi)
                </label>
                <input
                  type="number"
                  value={formData.waterSupplyPressure || ""}
                  onChange={(e) =>
                    updateFormData(
                      "waterSupplyPressure",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 65"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Water Supply Flow (gpm)
                </label>
                <input
                  type="number"
                  value={formData.waterSupplyFlow || ""}
                  onChange={(e) =>
                    updateFormData(
                      "waterSupplyFlow",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2500"
                />
              </div>
            </div>
          </div>
        );

      case 1: // ASRS Configuration
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                ASRS Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    value: "hl-mini-load",
                    label: "Horizontal-Loading Mini-load",
                    desc: "Uses angle irons/guides",
                  },
                  {
                    value: "hl-shuttle",
                    label: "Horizontal-Loading Shuttle",
                    desc: "Uses slats/mesh shelving",
                  },
                  {
                    value: "top-loading",
                    label: "Top-Loading ASRS",
                    desc: "Robots access from above",
                  },
                  {
                    value: "vertically-enclosed",
                    label: "Vertically Enclosed",
                    desc: "Lift or carousel type",
                  },
                ].map((type) => (
                  <div
                    key={type.value}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="asrsType"
                        value={type.value}
                        checked={formData.asrsType === type.value}
                        onChange={(e) =>
                          updateFormData("asrsType", e.target.value)
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-sm text-gray-600">{type.desc}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Storage Length (ft)
                </label>
                <input
                  type="number"
                  value={formData.storageLength || ""}
                  onChange={(e) =>
                    updateFormData("storageLength", parseFloat(e.target.value))
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Storage Width (ft)
                </label>
                <input
                  type="number"
                  value={formData.storageWidth || ""}
                  onChange={(e) =>
                    updateFormData("storageWidth", parseFloat(e.target.value))
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Storage Height (ft)
                </label>
                <input
                  type="number"
                  value={formData.storageHeight || ""}
                  onChange={(e) =>
                    updateFormData("storageHeight", parseFloat(e.target.value))
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formData.storageHeight > 20 && (
                  <p className="text-amber-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    &gt;20 ft triggers enhanced protection requirements
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Number of Storage Levels
                </label>
                <input
                  type="number"
                  value={formData.numberOfLevels || ""}
                  onChange={(e) =>
                    updateFormData("numberOfLevels", parseFloat(e.target.value))
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Aisle Width (ft)
                </label>
                <input
                  type="number"
                  value={formData.aisleWidth || ""}
                  onChange={(e) =>
                    updateFormData("aisleWidth", parseFloat(e.target.value))
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formData.aisleWidth < 6 && formData.aisleWidth > 0 && (
                  <p className="text-amber-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    &lt;6 ft may require higher sprinkler pressures
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 2: // Rack Structure
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Rack Row Depth (ft)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.rackRowDepth || ""}
                  onChange={(e) =>
                    updateFormData("rackRowDepth", parseFloat(e.target.value))
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formData.rackRowDepth > 6 && (
                  <p className="text-amber-600 text-sm mt-1 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    &gt;6 ft requires enhanced protection
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Rack Upright Spacing (in)
                </label>
                <input
                  type="number"
                  value={formData.rackUprightSpacing || ""}
                  onChange={(e) =>
                    updateFormData(
                      "rackUprightSpacing",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Typical: 18-24 inches"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Tier Height (in)
                </label>
                <input
                  type="number"
                  value={formData.tierHeight || ""}
                  onChange={(e) =>
                    updateFormData("tierHeight", parseFloat(e.target.value))
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Typical: 9-18 inches"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Support Type
                </label>
                <select
                  value={formData.supportType}
                  onChange={(e) =>
                    updateFormData("supportType", e.target.value)
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="angle-irons">
                    Angle Irons/Guides (Mini-load)
                  </option>
                  <option value="slats-mesh">
                    Slats/Mesh Shelving (Shuttle)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Transverse Flue Width (in)
                </label>
                <input
                  type="number"
                  value={formData.transverseFlueWidth || ""}
                  onChange={(e) =>
                    updateFormData(
                      "transverseFlueWidth",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum: 3 inches"
                />
                {formData.transverseFlueWidth < 3 &&
                  formData.transverseFlueWidth > 0 && (
                    <p className="text-red-600 text-sm mt-1 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Minimum 3 inches required
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Longitudinal Flue Width (in)
                </label>
                <input
                  type="number"
                  value={formData.longitudinalFlueWidth || ""}
                  onChange={(e) =>
                    updateFormData(
                      "longitudinalFlueWidth",
                      parseFloat(e.target.value)
                    )
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Range: 3-24 inches"
                />
              </div>
            </div>
          </div>
        );

      case 3: // Container Details
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Container Material
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    value: "noncombustible",
                    label: "Noncombustible (Metal)",
                    benefit: "Lowest sprinkler requirements",
                  },
                  {
                    value: "combustible-cellulosic",
                    label: "Combustible Cellulosic (Cardboard)",
                    benefit: "Moderate requirements",
                  },
                  {
                    value: "unexpanded-plastic",
                    label: "Unexpanded Plastic",
                    benefit: "Higher requirements",
                  },
                ].map((material) => (
                  <div
                    key={material.value}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="containerMaterial"
                        value={material.value}
                        checked={formData.containerMaterial === material.value}
                        onChange={(e) =>
                          updateFormData("containerMaterial", e.target.value)
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{material.label}</div>
                        <div className="text-sm text-gray-600">
                          {material.benefit}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Container Configuration
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    value: "closed-top",
                    label: "Closed-Top",
                    benefit: "Reduces fire spread",
                  },
                  {
                    value: "open-top",
                    label: "Open-Top",
                    benefit: "May require in-rack sprinklers",
                  },
                ].map((config) => (
                  <div
                    key={config.value}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="containerConfiguration"
                        value={config.value}
                        checked={
                          formData.containerConfiguration === config.value
                        }
                        onChange={(e) =>
                          updateFormData(
                            "containerConfiguration",
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{config.label}</div>
                        <div className="text-sm text-gray-600">
                          {config.benefit}
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Container Dimensions
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Length (in)
                  </label>
                  <input
                    type="number"
                    value={formData.containerDimensions.length || ""}
                    onChange={(e) =>
                      updateNestedFormData(
                        "containerDimensions",
                        "length",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Width (in)
                  </label>
                  <input
                    type="number"
                    value={formData.containerDimensions.width || ""}
                    onChange={(e) =>
                      updateNestedFormData(
                        "containerDimensions",
                        "width",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Height (in)
                  </label>
                  <input
                    type="number"
                    value={formData.containerDimensions.height || ""}
                    onChange={(e) =>
                      updateNestedFormData(
                        "containerDimensions",
                        "height",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Commodity Classification
              </label>
              <select
                value={formData.commodityClass}
                onChange={(e) =>
                  updateFormData("commodityClass", e.target.value)
                }
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select classification</option>
                <option value="Class 1">
                  Class 1 - Noncombustible products in noncombustible packaging
                </option>
                <option value="Class 2">
                  Class 2 - Noncombustible products in combustible packaging
                </option>
                <option value="Class 3">Class 3 - Combustible products</option>
                <option value="Class 4">
                  Class 4 - Class 1-3 with limited plastic content
                </option>
                <option value="Cartoned Unexpanded Plastic">
                  Cartoned Unexpanded Plastic
                </option>
                <option value="Uncartoned Unexpanded Plastic">
                  Uncartoned Unexpanded Plastic
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Special Hazards (check all that apply)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "Ignitable Liquids",
                  "Aerosols",
                  "Lithium-ion Batteries",
                  "Flammable Gases",
                  "Oxidizing Materials",
                  "None",
                ].map((hazard) => (
                  <label key={hazard} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.specialHazards.includes(hazard)}
                      onChange={(e) =>
                        handleSpecialHazardChange(hazard, e.target.checked)
                      }
                      className="rounded"
                    />
                    <span className="text-sm">{hazard}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // Environmental Conditions
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Ambient Temperature
                </label>
                <select
                  value={formData.ambientTemp}
                  onChange={(e) =>
                    updateFormData("ambientTemp", e.target.value)
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select temperature range</option>
                  <option value="freezer">Freezer (&lt;32°F)</option>
                  <option value="cooler">Cooler (32-50°F)</option>
                  <option value="ambient">Ambient (50-100°F)</option>
                  <option value="high-temp">
                    High Temperature (&gt;100°F)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Ventilation Conditions
                </label>
                <select
                  value={formData.ventilation}
                  onChange={(e) =>
                    updateFormData("ventilation", e.target.value)
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select ventilation</option>
                  <option value="natural">Natural Ventilation</option>
                  <option value="mechanical">Mechanical Ventilation</option>
                  <option value="minimal">Minimal/No Ventilation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Seismic Zone
                </label>
                <select
                  value={formData.seismicZone}
                  onChange={(e) =>
                    updateFormData("seismicZone", e.target.value)
                  }
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select seismic zone</option>
                  <option value="0">Zone 0 (No seismic activity)</option>
                  <option value="1">Zone 1 (Low seismic activity)</option>
                  <option value="2">Zone 2 (Moderate seismic activity)</option>
                  <option value="3">Zone 3 (High seismic activity)</option>
                  <option value="4">Zone 4 (Very high seismic activity)</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 5: // Review & Recommendations
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Configuration Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>ASRS Type:</strong> {formData.asrsType}
                </div>
                <div>
                  <strong>Storage Height:</strong> {formData.storageHeight} ft
                </div>
                <div>
                  <strong>Rack Depth:</strong> {formData.rackRowDepth} ft
                </div>
                <div>
                  <strong>Container Material:</strong>{" "}
                  {formData.containerMaterial}
                </div>
                <div>
                  <strong>Container Config:</strong>{" "}
                  {formData.containerConfiguration}
                </div>
                <div>
                  <strong>Commodity Class:</strong> {formData.commodityClass}
                </div>
              </div>
            </div>

            {recommendations.length > 0 && (
              <div className="bg-amber-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-amber-600" />
                  Cost Optimization Recommendations
                </h3>
                <ul className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">
                      {rec}
                    </li>
                  ))}
                </ul>
                {potentialSavings > 0 && (
                  <div className="mt-4 p-4 bg-green-100 rounded">
                    <strong>
                      Potential Savings: ${potentialSavings.toLocaleString()}
                    </strong>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Next Steps</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Complete hydraulic calculations based on configuration</li>
                <li>Generate detailed sprinkler layout drawings</li>
                <li>Verify compliance with local fire codes</li>
                <li>Prepare equipment specifications</li>
                <li>Schedule design review with FM Global</li>
              </ol>
            </div>

            <div className="flex space-x-4">
              <button className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                Generate Quote
              </button>
              <button className="flex-1 border border-blue-600 text-blue-600 py-3 px-6 rounded-lg hover:bg-blue-50 transition-colors">
                Download Report
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ASRS Sprinkler System Requirements
        </h1>
        <p className="text-gray-600">
          FM Global 8-34 Compliance Assessment & Cost Optimization
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <span
              key={index}
              className={`text-xs ${
                index <= currentStep
                  ? "text-blue-600 font-medium"
                  : "text-gray-400"
              }`}
            >
              {step}
            </span>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6">{steps[currentStep]}</h2>
        {renderStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="flex items-center px-6 py-3 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>

        <button
          onClick={nextStep}
          disabled={currentStep === steps.length - 1}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </div>
  );
};

export default ASRSRequirementsForm;
