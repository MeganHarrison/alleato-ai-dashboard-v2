'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  MagnifyingGlassIcon, 
  DocumentTextIcon, 
  ChevronRightIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowLeftIcon,
  LinkIcon
} from '@heroicons/react/24/outline';

// Types
interface TableCategory {
  name: string;
  icon: string;
  expanded: boolean;
  tables: Table[];
}

interface Table {
  id: string;
  number: number;
  short_title: string;
  extraction_status: 'complete' | 'pending';
  priority?: string;
  description?: string;
}

interface TableData {
  metadata: {
    id: string;
    title: string;
    description: string;
    asrs_type: string;
    system_type: string;
    protection_scheme: string;
    priority: string;
  };
  data: TableRow[];
}

interface TableRow {
  ceiling_height_ft: number;
  sprinklers: {
    pendent: {
      quick_response: SprinklerSpec[];
    };
  };
}

interface SprinklerSpec {
  k_factor: number;
  count: number;
  pressure_psi: number;
}

interface DecisionPath {
  asrs_type: string | null;
  container_type: string | null;
  system_type: string | null;
}

interface ApplicableTable {
  id: string;
  number: number;
  priority: string;
  short_title: string;
  description: string;
}

const FMDocsInterface: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [currentTableData, setCurrentTableData] = useState<TableData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [decisionPath, setDecisionPath] = useState<DecisionPath>({
    asrs_type: null,
    container_type: null,
    system_type: null
  });
  const [applicableTables, setApplicableTables] = useState<ApplicableTable[]>([]);

  // Static data
  const criticalTables: Table[] = [
    { id: 'Table_4', number: 4, short_title: 'Shuttle Wet Class 1-3', extraction_status: 'complete' },
    { id: 'Table_27', number: 27, short_title: 'Mini-Load Wet Class 1-4', extraction_status: 'complete' },
    { id: 'Table_5', number: 5, short_title: 'Shuttle Dry Class 1-3', extraction_status: 'complete' },
    { id: 'Table_43', number: 43, short_title: 'Top-Load Noncombustible', extraction_status: 'pending' }
  ];

  const [tableCategories, setTableCategories] = useState<TableCategory[]>([
    {
      name: 'Shuttle ASRS',
      icon: '🔄',
      expanded: false,
      tables: [
        { id: 'Table_6', number: 6, short_title: 'Wet Class 4/Plastic', extraction_status: 'complete' },
        { id: 'Table_7', number: 7, short_title: 'Dry Class 4/Plastic', extraction_status: 'pending' },
        { id: 'Table_15', number: 15, short_title: 'Wet In-Rack Closed-Top', extraction_status: 'pending' }
      ]
    },
    {
      name: 'Mini-Load ASRS',
      icon: '📦',
      expanded: false,
      tables: [
        { id: 'Table_28', number: 28, short_title: 'Dry Class 1-4', extraction_status: 'pending' },
        { id: 'Table_32', number: 32, short_title: 'Wet In-Rack System', extraction_status: 'pending' },
        { id: 'Table_33', number: 33, short_title: 'Dry In-Rack System', extraction_status: 'pending' }
      ]
    },
    {
      name: 'Top-Loading ASRS',
      icon: '⬆️',
      expanded: false,
      tables: [
        { id: 'Table_44', number: 44, short_title: 'Alternative Protection', extraction_status: 'pending' },
        { id: 'Table_45', number: 45, short_title: 'Plastic ≤20ft', extraction_status: 'pending' }
      ]
    }
  ]);

  const asrsTypes = [
    { value: 'mini_load', name: 'Mini-Load', description: 'Angle iron supports' },
    { value: 'shuttle', name: 'Shuttle', description: 'Slat/mesh shelving' },
    { value: 'top_loading', name: 'Top-Loading', description: 'Grid-based access' }
  ];

  const containerTypes = [
    { value: 'noncombustible_closed', name: 'Noncombustible Closed', description: 'Metal with closed tops', cost_impact: 'Lowest protection' },
    { value: 'combustible_closed', name: 'Combustible Closed', description: 'Cardboard/plastic closed' },
    { value: 'combustible_open', name: 'Combustible Open', description: 'Open-top containers', cost_impact: 'Requires in-rack' },
    { value: 'plastic_expanded', name: 'Expanded Plastic', description: 'Foam containers', cost_impact: 'Highest protection' }
  ];

  // Mock table data
  const mockTableData: Record<string, TableData> = {
    'Table_4': {
      metadata: {
        id: 'Table_4',
        title: 'Table 4: Ceiling-Level Protection Guidelines on a Wet System for Class 1-2-3 Commodities',
        description: 'Sprinkler requirements for shuttle ASRS with Class 1, 2, and 3 commodities using wet sprinkler systems',
        asrs_type: 'Shuttle',
        system_type: 'Wet',
        protection_scheme: 'Ceiling Only',
        priority: 'Critical'
      },
      data: [
        {
          ceiling_height_ft: 10,
          sprinklers: {
            pendent: {
              quick_response: [
                { k_factor: 11.2, count: 12, pressure_psi: 7 },
                { k_factor: 14.0, count: 12, pressure_psi: 7 },
                { k_factor: 16.8, count: 12, pressure_psi: 7 }
              ]
            }
          }
        },
        {
          ceiling_height_ft: 15,
          sprinklers: {
            pendent: {
              quick_response: [
                { k_factor: 11.2, count: 20, pressure_psi: 12 },
                { k_factor: 14.0, count: 16, pressure_psi: 8 },
                { k_factor: 16.8, count: 16, pressure_psi: 7 }
              ]
            }
          }
        },
        {
          ceiling_height_ft: 25,
          sprinklers: {
            pendent: {
              quick_response: [
                { k_factor: 14.0, count: 20, pressure_psi: 15 },
                { k_factor: 16.8, count: 16, pressure_psi: 10 },
                { k_factor: 22.4, count: 16, pressure_psi: 7 }
              ]
            }
          }
        }
      ]
    }
  };

  const toggleCategory = useCallback((categoryIndex: number) => {
    setTableCategories(prev => 
      prev.map((category, index) => 
        index === categoryIndex 
          ? { ...category, expanded: !category.expanded }
          : category
      )
    );
  }, []);

  const loadTable = useCallback((tableId: string) => {
    setSelectedTable(tableId);
    setCurrentTableData(mockTableData[tableId] || null);
    setActiveSection('table-view');
  }, []);

  const selectDecisionNode = useCallback((key: keyof DecisionPath, value: string) => {
    setDecisionPath(prev => ({ ...prev, [key]: value }));
    updateApplicableTables({ ...decisionPath, [key]: value });
  }, [decisionPath]);

  const updateApplicableTables = useCallback((path: DecisionPath) => {
    const newTables: ApplicableTable[] = [];

    if (path.asrs_type && path.container_type && path.system_type) {
      if (path.asrs_type === 'shuttle' && path.container_type === 'noncombustible_closed') {
        if (path.system_type === 'wet') {
          newTables.push({
            id: 'Table_4',
            number: 4,
            priority: 'Critical',
            short_title: 'Wet System Class 1-3',
            description: 'Ceiling protection for noncombustible containers'
          });
        } else {
          newTables.push({
            id: 'Table_5',
            number: 5,
            priority: 'Critical',
            short_title: 'Dry System Class 1-3',
            description: 'Ceiling protection for dry systems'
          });
        }
      } else if (path.asrs_type === 'mini_load') {
        newTables.push({
          id: 'Table_27',
          number: 27,
          priority: 'Critical',
          short_title: 'Mini-Load Protection',
          description: 'Ceiling protection for mini-load systems'
        });
      }
    }

    setApplicableTables(newTables);
  }, []);

  const handleSearch = useCallback(() => {
    console.log('Searching for:', searchQuery);
  }, [searchQuery]);

  const openDesignForm = useCallback(() => {
    alert('Opening Requirements Calculator...\n\nThis would launch the full interactive design form for detailed requirements calculation.');
  }, []);

  const renderOverview = () => (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">FM Global 8-34: ASRS Protection Guide</h1>
        <p className="text-xl text-gray-600 mb-6">Comprehensive protection requirements for Automatic Storage and Retrieval Systems</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <InformationCircleIcon className="w-6 h-6 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Latest Version: July 2024</h3>
              <p className="text-blue-700">This guide covers all current FM Global 8-34 requirements. Use our calculator to get instant design requirements for your ASRS project.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <DocumentTextIcon className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Mini-Load ASRS</h3>
          <p className="text-gray-600 text-sm mb-4">Uses angle irons for container support. Most common type for small parts storage.</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Typically 9-18" tier heights</div>
            <div>• Requires Tables 27-42</div>
            <div>• 18-24" rack upright spacing</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <DocumentTextIcon className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Shuttle ASRS</h3>
          <p className="text-gray-600 text-sm mb-4">Uses slats/mesh shelving without vertical guides. Higher density storage.</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Direct storage on rails</div>
            <div>• Requires Tables 4-25</div>
            <div>• Various commodity classes</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <DocumentTextIcon className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Top-Loading ASRS</h3>
          <p className="text-gray-600 text-sm mb-4">Robot access from above on grid system. Specialized applications.</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>• Grid-based access</div>
            <div>• Requires Tables 43-46</div>
            <div>• Container type critical</div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Protection Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Open-Top Containers</h4>
                <p className="text-sm text-gray-600">Always require in-rack sprinklers. Can increase costs by $150K+</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Height Thresholds</h4>
                <p className="text-sm text-gray-600">Storage {'>'}20ft triggers enhanced protection. Consider design optimization.</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                <InformationCircleIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Wet vs Dry Systems</h4>
                <p className="text-sm text-gray-600">Wet systems typically require 25-40% fewer sprinklers than dry systems</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderOverview()}
      </div>
    </div>
  );
}

export default FMDocsInterface;