import { NextRequest, NextResponse } from 'next/server';
import { FMGlobal834Calculator } from '@/lib/fm-global/calculator';
import type { ASRSConfiguration } from '@/lib/fm-global/calculator';

type CommodityClass = 'I' | 'II' | 'III' | 'IV' | 'cartoned-plastic' | 'uncartoned-plastic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.json();
    
    // Validate required fields
    if (!formData.asrs_type || !formData.container_type) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: ASRS type and container type are required' 
        },
        { status: 400 }
      );
    }

    // Transform form data to calculator configuration
    const configuration: ASRSConfiguration = {
      asrsType: formData.asrs_type.toLowerCase().replace('_', '-') as 'shuttle' | 'mini-load' | 'top-loading' | 'carousel',
      containerType: formData.container_type.toLowerCase().replace('_', '-') as 'closed-top' | 'open-top' | 'mixed',
      rackDepth: formData.rack_depth_ft || 6,
      rackSpacing: formData.rack_spacing_ft || 5,
      ceilingHeight: formData.ceiling_height_ft || 30,
      storageHeight: formData.storage_height_ft || 25,
      commodityClass: mapCommodityType(formData.commodity_type),
      containerMaterial: formData.container_material || 'noncombustible',
      sprinklerSystem: formData.system_type || 'wet',
      storageLength: formData.storage_length_ft || 100,
      storageWidth: formData.storage_width_ft || 50,
      seismicZone: formData.seismic_zone || 'low'
    };

    // Use deterministic calculator for consistent results
    const calculator = new FMGlobal834Calculator();
    const requirements = calculator.calculateRequirements(configuration);
    
    // Format response to match expected structure
    const specification = {
      applicableFigures: requirements.applicableFigures,
      applicableTables: requirements.applicableTables,
      sprinklerCount: requirements.estimatedSprinklerCount?.total || 0,
      protectionScheme: requirements.protectionScheme,
      inRackProtection: {
        required: requirements.protectionScheme === 'ceiling-and-in-rack',
        count: requirements.estimatedSprinklerCount?.inRack || 0,
        spacing: requirements.maxInRackSprinklerSpacing
      },
      density: requirements.ceilingSprinklerDensity,
      designArea: requirements.designArea,
      kFactor: {
        ceiling: requirements.ceilingKFactor,
        inRack: requirements.inRackKFactor
      },
      temperatureRating: requirements.sprinklerTemperatureRating,
      responseType: requirements.responseType,
      minimumPressure: requirements.minimumPressure,
      hoseDemand: requirements.hoseDemand,
      waterSupplyDuration: requirements.waterSupplyDuration,
      complianceStatus: requirements.complianceStatus,
      violations: requirements.violations,
      warnings: requirements.warnings,
      clearanceToStorage: requirements.minClearanceToStorage
    };
    
    return NextResponse.json({
      success: true,
      specification,
      submissionId: `ASRS-${Date.now()}`,
      metadata: {
        source: 'FM Global 8-34 Calculator (Deterministic)',
        calculatorVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        configuration: configuration
      }
    });

  } catch (error) {
    console.error('FM Global form API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process ASRS requirements' 
      },
      { status: 500 }
    );
  }
}

// Helper function to map commodity types from form to calculator format
function mapCommodityType(commodityTypes: string[] | undefined): CommodityClass {
  if (!commodityTypes || commodityTypes.length === 0) {
    return 'III'; // Default to Class III
  }
  
  const primaryType = commodityTypes[0];
  
  // Map common form values to commodity classes
  const commodityMap: Record<string, CommodityClass> = {
    'Class I': 'I',
    'Class II': 'II',
    'Class III': 'III',
    'Class IV': 'IV',
    'Cartoned Unexpanded Plastics': 'cartoned-plastic',
    'Cartoned Expanded Plastics': 'cartoned-plastic',
    'Uncartoned Unexpanded Plastics': 'uncartoned-plastic',
    'Uncartoned Expanded Plastics': 'uncartoned-plastic',
    'Class 1': 'I',
    'Class 2': 'II',
    'Class 3': 'III',
    'Class 4': 'IV',
  };
  
  return commodityMap[primaryType] || 'III';
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: '/api/fm-global/form',
    engine: 'FM Global 8-34 Deterministic Calculator',
    version: '1.0.0',
    description: 'FM Global ASRS form submission endpoint using deterministic rules engine for consistent, objective calculations'
  });
}