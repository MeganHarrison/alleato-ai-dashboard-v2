"use client";

import React, { useState } from 'react';
import { Calculator, FileText, AlertCircle, Info, ChevronDown, ChevronUp, ArrowLeft, ExternalLink } from 'lucide-react';

// Real data from Table 1
const table1Data = {
  id: "table_1",
  table_number: 1,
  title: "Determining Number of Sprinklers per Branch Line for Ceiling Sprinkler System Hydraulic Design",
  pages: [11, 12],
  section: "2.1.4.5.4",
  asrs_type: "All ASRS Types",
  system_type: "Wet and Dry Systems",
  protection_scheme: "Ceiling-Level Sprinklers",
  
  equations: [
    {
      equation_number: 1,
      formula: "(1.2 / SAVG) × √(Number of Sprinklers in Ceiling Design × SAVG × LAVG)",
      condition: "Ceiling Slope ≤ 1 in 12",
      variables: {
        LAVG: "Average between line spacing used within the calculated sprinkler system",
        SAVG: "Average on-line spacing used within the calculated sprinkler system"
      }
    },
    {
      equation_number: 2,
      formula: "(1.4 / SAVG) × √(Number of Sprinklers in Ceiling Design × SAVG × LAVG)",
      condition: "1 in 12 < Ceiling Slope ≤ 2 in 12",
      variables: {
        LAVG: "Average between line spacing used within the calculated sprinkler system",
        SAVG: "Average on-line spacing used within the calculated sprinkler system"
      }
    }
  ],

  footnotes: [
    "Instead of using calculation methods in Data Sheet 3-0, use Table 1 for ceiling-level sprinklers.",
    "Use Data Sheet 3-0 for all other flow and pressure determinations.",
    "Average distance is indicated to account for fluctuations in spacing due to ceiling structural members.",
    "Most common sprinkler spacing can be used when spacing values are generally consistent."
  ],

  data_points: [
    {
      sprinkler_type: "Extended Coverage",
      sprinklers_in_design: 6,
      conditions: [
        { max_ceiling_slope: "2 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: 3 },
        { max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "unobstructed", sprinklers_per_branch: "equation_1" },
        { max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "obstructed", sprinklers_per_branch: "equation_2" }
      ]
    },
    {
      sprinkler_type: "Extended Coverage",
      sprinklers_in_design: 8,
      conditions: [
        { max_ceiling_slope: "1 in 12", on_line_spacing_ft: "≤ 12 (3.7m)", ceiling_construction: "any", sprinklers_per_branch: 4 },
        { max_ceiling_slope: "1 in 12", on_line_spacing_ft: "> 12 (3.7m)", ceiling_construction: "any", sprinklers_per_branch: 3 },
        { max_ceiling_slope: "2 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: 4 },
        { max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "unobstructed", sprinklers_per_branch: "equation_1" },
        { max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "obstructed", sprinklers_per_branch: "equation_2" }
      ]
    },
    {
      sprinkler_type: "Standard Coverage / Extended Coverage",
      sprinklers_in_design: 9,
      conditions: [
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "2 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: 3 },
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "unobstructed", sprinklers_per_branch: "equation_1" },
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "obstructed", sprinklers_per_branch: "equation_2" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "2 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: 4 },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "unobstructed", sprinklers_per_branch: "equation_1" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "obstructed", sprinklers_per_branch: "equation_2" }
      ]
    },
    {
      sprinkler_type: "Standard Coverage / Extended Coverage",
      sprinklers_in_design: 10,
      conditions: [
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "1 in 12", on_line_spacing_ft: "< 10 (3.0m)", ceiling_construction: "any", sprinklers_per_branch: 4 },
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "1 in 12", on_line_spacing_ft: "≥ 10 (3.0m)", ceiling_construction: "any", sprinklers_per_branch: 3 },
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "2 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: 4 },
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "unobstructed", sprinklers_per_branch: "equation_1" },
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "obstructed", sprinklers_per_branch: "equation_2" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "1 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: "equation_1" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "2 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: "equation_2" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "unobstructed", sprinklers_per_branch: "equation_1" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "obstructed", sprinklers_per_branch: "equation_2" }
      ]
    },
    {
      sprinkler_type: "Standard Coverage / Extended Coverage",
      sprinklers_in_design: 12,
      conditions: [
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "2 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: 4 },
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "unobstructed", sprinklers_per_branch: "equation_1" },
        { sprinkler_type: "Standard Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "obstructed", sprinklers_per_branch: "equation_2" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "1 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: "equation_1" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "2 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: "equation_2" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "unobstructed", sprinklers_per_branch: "equation_1" },
        { sprinkler_type: "Extended Coverage", max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "obstructed", sprinklers_per_branch: "equation_2" }
      ]
    },
    {
      sprinkler_type: "Any",
      sprinklers_in_design: "> 12",
      conditions: [
        { max_ceiling_slope: "1 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: "equation_1" },
        { max_ceiling_slope: "2 in 12", on_line_spacing_ft: "any", ceiling_construction: "any", sprinklers_per_branch: "equation_2" },
        { max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "unobstructed", sprinklers_per_branch: "equation_1" },
        { max_ceiling_slope: "4 in 12", on_line_spacing_ft: "any", ceiling_construction: "obstructed", sprinklers_per_branch: "equation_2" }
      ]
    }
  ],

  minimum_design_areas: {
    unobstructed_ceiling: [
      { sprinklers_in_design: 9, min_design_area_sqft: 576, min_design_area_sqm: 53.5 },
      { sprinklers_in_design: 10, min_design_area_sqft: 640, min_design_area_sqm: 59.5 },
      { sprinklers_in_design: "≥ 12", min_design_area_sqft: 768, min_design_area_sqm: 71.3 }
    ],
    obstructed_ceiling: {
      note: "When ceiling sprinklers can be installed under ceiling structural members, follow unobstructed guidelines. When sprinklers are required in every channel and spacing follows Data Sheet 2-0, minimum design area is not applicable."
    }
  },

  special_conditions: ["separation"],
  rounding_rules: {
    method: "normal",
    description: "Round down for 0.49 or less; round up for 0.50 and greater"
  }
};

const Table1Display = () => {
  const [selectedDataPoint] = useState(false);
  const [showEquations] = useState(false);
  const [showFootnotes] = useState(false);
  const [calculatorInputs] = useState(false);
  const getSprinklersPerBranch = (condition: unknown, sprinklersInDesign: number, savg = 12, lavg = 12) => {
    if (typeof condition.sprinklers_per_branch === 'number') {
      return condition.sprinklers_per_branch;
    }
    
    if (condition.sprinklers_per_branch === 'equation_1') {
      // Equation 1: (1.2 / SAVG) × √(Number of Sprinklers in Ceiling Design × SAVG × LAVG)
      return Math.round((1.2 / savg) * Math.sqrt(sprinklersInDesign * savg * lavg));
    }
    
    if (condition.sprinklers_per_branch === 'equation_2') {
      // Equation 2: (1.4 / SAVG) × √(Number of Sprinklers in Ceiling Design × SAVG × LAVG)
      return Math.round((1.4 / savg) * Math.sqrt(sprinklersInDesign * savg * lavg));
    }
    
    return condition.sprinklers_per_branch;
  };

  const EquationDisplay = ({ equation }: { equation: unknown }) => (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded">
          Equation {equation.equation_number}
        </div>
        <div className="flex-1">
          <div className="text-sm text-blue-700 font-medium mb-2">{equation.condition}</div>
          <div className="bg-white border border-blue-200 rounded p-3 font-mono text-sm">
            {equation.formula}
          </div>
          <div className="mt-2 text-xs text-blue-600">
            <div><strong>SAVG:</strong> {equation.variables.SAVG}</div>
            <div><strong>LAVG:</strong> {equation.variables.LAVG}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const DataPointTable = ({ dataPoint, index }: { dataPoint: unknown; index: number }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">
              {dataPoint.sprinkler_type} - {dataPoint.sprinklers_in_design} Sprinklers in Design
            </h4>
          </div>
          <div className="text-sm text-gray-600">
            Data Point {index + 1}
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Sprinkler Type</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Max Ceiling Slope</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">On-Line Spacing</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Ceiling Construction</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Sprinklers per Branch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dataPoint.conditions.map((condition: unknown, condIndex: number) => (
              <tr key={condIndex} className="hover:bg-gray-50">
                <td className="px-4 py-3">{condition.sprinkler_type || dataPoint.sprinkler_type}</td>
                <td className="px-4 py-3">{condition.max_ceiling_slope}</td>
                <td className="px-4 py-3">{condition.on_line_spacing_ft}</td>
                <td className="px-4 py-3 capitalize">{condition.ceiling_construction}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    typeof condition.sprinklers_per_branch === 'string' && condition.sprinklers_per_branch.includes('equation')
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {condition.sprinklers_per_branch}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Calculator = () => {
    const [result, setResult] = useState<{
      sprinklersPerBranch: unknown;
      dataPoint: unknown;
      condition: unknown;
      equation?: unknown;
    } | null>(null);

    const calculate = () => {
      const sprinklersInDesign = parseInt(calculatorInputs.sprinklersInDesign);
      const savg = parseFloat(calculatorInputs.onLineSpacing) || 12;
      const lavg = 12; // Default average between line spacing
      
      // Find matching data point
      const matchingDataPoint = table1Data.data_points.find(dp => 
        dp.sprinklers_in_design === sprinklersInDesign || 
        (dp.sprinklers_in_design === "> 12" && sprinklersInDesign > 12)
      );

      if (matchingDataPoint) {
        // Find matching condition
        const matchingCondition = matchingDataPoint.conditions.find(condition => {
          const slopeMatch = condition.max_ceiling_slope === calculatorInputs.ceilingSlope;
          const constructionMatch = condition.ceiling_construction === calculatorInputs.ceilingConstruction || 
                                   condition.ceiling_construction === 'any';
          const typeMatch = !(condition as any).sprinkler_type || 
                           (condition as any).sprinkler_type?.toLowerCase().includes(calculatorInputs.sprinklerType);
          
          return slopeMatch && constructionMatch && typeMatch;
        });

        if (matchingCondition) {
          const sprinklersPerBranch = getSprinklersPerBranch(matchingCondition, sprinklersInDesign, savg, lavg);
          setResult({
            sprinklersPerBranch,
            dataPoint: matchingDataPoint,
            condition: matchingCondition,
            equation: typeof matchingCondition.sprinklers_per_branch === 'string' && 
                     matchingCondition.sprinklers_per_branch.includes('equation') ? 
                     table1Data.equations.find(eq => eq.equation_number === 
                       parseInt((matchingCondition.sprinklers_per_branch as string).split('_')[1])) : null
          });
        }
      }
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="text-blue-600">🧮</div>
          Branch Line Calculator
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Sprinklers in Design
              </label>
              <select
                value={calculatorInputs.sprinklersInDesign}
                onChange={(e) => setCalculatorInputs({...calculatorInputs, sprinklersInDesign: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="6">6</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="12">12</option>
                <option value="15">15 (&gt;12)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Ceiling Slope
              </label>
              <select
                value={calculatorInputs.ceilingSlope}
                onChange={(e) => setCalculatorInputs({...calculatorInputs, ceilingSlope: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select...</option>
                <option value="1 in 12">1 in 12</option>
                <option value="2 in 12">2 in 12</option>
                <option value="4 in 12">4 in 12</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                On-Line Spacing (ft)
              </label>
              <input
                type="number"
                value={calculatorInputs.onLineSpacing}
                onChange={(e) => setCalculatorInputs({...calculatorInputs, onLineSpacing: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ceiling Construction
              </label>
              <select
                value={calculatorInputs.ceilingConstruction}
                onChange={(e) => setCalculatorInputs({...calculatorInputs, ceilingConstruction: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="unobstructed">Unobstructed</option>
                <option value="obstructed">Obstructed</option>
                <option value="any">Any</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sprinkler Type
              </label>
              <select
                value={calculatorInputs.sprinklerType}
                onChange={(e) => setCalculatorInputs({...calculatorInputs, sprinklerType: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="extended_coverage">Extended Coverage</option>
                <option value="standard_coverage">Standard Coverage</option>
              </select>
            </div>

            <button
              onClick={calculate}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Calculate
            </button>
          </div>

          <div>
            <h4 className="font-medium mb-3">Result</h4>
            {result ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-700">{result.sprinklersPerBranch}</div>
                  <div className="text-sm text-green-600">Sprinklers per Branch Line</div>
                </div>
                
                {result.equation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-blue-700 mb-1">Applied Equation {result.equation.equation_number}:</div>
                    <div className="text-xs font-mono text-blue-600">{result.equation.formula}</div>
                  </div>
                )}

                <div className="text-xs text-gray-600">
                  <div><strong>Condition:</strong> {result.condition.max_ceiling_slope} slope, {result.condition.ceiling_construction} ceiling</div>
                  <div><strong>Data Point:</strong> {result.dataPoint.sprinklers_in_design} sprinklers in design</div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8">
                Enter parameters to calculate
              </div>
            )}
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
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft size={20} />
                Back to Tables
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2.5 py-0.5 rounded">
                  Table {table1Data.table_number}
                </span>
                <h1 className="text-xl font-bold text-gray-900 mt-1">{table1Data.title}</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Pages {table1Data.pages.join(', ')}</span>
              <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <ExternalLink size={16} />
                View PDF
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Table Metadata */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Application</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>ASRS Type: {table1Data.asrs_type}</div>
                <div>System Type: {table1Data.system_type}</div>
                <div>Protection: {table1Data.protection_scheme}</div>
                <div>Section: {table1Data.section}</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Special Conditions</h3>
              <div className="flex flex-wrap gap-2">
                {table1Data.special_conditions.map(condition => (
                  <span key={condition} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {condition}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Rounding Rules</h3>
              <div className="text-sm text-gray-600">
                {table1Data.rounding_rules.description}
              </div>
            </div>
          </div>
        </div>

        {/* Equations Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <button
            onClick={() => setShowEquations(!showEquations)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900">Mathematical Equations</h3>
            {showEquations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {showEquations && (
            <div className="mt-4">
              {table1Data.equations.map(equation => (
                <EquationDisplay key={equation.equation_number} equation={equation} />
              ))}
            </div>
          )}
        </div>

        {/* Calculator */}
        <div className="mb-6">
          <Calculator />
        </div>

        {/* Data Points Tables */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sprinkler Requirements by Design Criteria</h3>
          
          {table1Data.data_points.map((dataPoint, index) => (
            <DataPointTable key={index} dataPoint={dataPoint} index={index} />
          ))}
        </div>

        {/* Minimum Design Areas */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Minimum Design Areas</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Unobstructed Ceiling</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Sprinklers in Design</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Min Area (sq ft)</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700">Min Area (sq m)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {table1Data.minimum_design_areas.unobstructed_ceiling.map((area, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">{area.sprinklers_in_design}</td>
                        <td className="px-4 py-3">{area.min_design_area_sqft}</td>
                        <td className="px-4 py-3">{area.min_design_area_sqm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Obstructed Ceiling</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    {table1Data.minimum_design_areas.obstructed_ceiling.note}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footnotes */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <button
            onClick={() => setShowFootnotes(!showFootnotes)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Info size={20} />
              Important Notes & Footnotes
            </h3>
            {showFootnotes ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {showFootnotes && (
            <div className="mt-4 space-y-3">
              {table1Data.footnotes.map((footnote, index) => (
                <div key={index} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                    {index + 1}
                  </span>
                  <span>{footnote}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Table1Display;