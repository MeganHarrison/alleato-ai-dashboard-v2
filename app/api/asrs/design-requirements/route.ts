/**
 * ASRS Decision Engine API Route
 * Provides deterministic FM Global 8-34 compliance requirements
 */

import { NextRequest, NextResponse } from 'next/server';
import { asrsEngine, ASRSInput } from '@/lib/asrs-decision-engine-db';

export async function POST(request: NextRequest) {
  try {
    const body: ASRSInput = await request.json();

    // Validate required fields
    const validation = validateInput(body);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Get deterministic requirements from database
    const requirements = await asrsEngine.getDesignRequirements(body);

    return NextResponse.json({
      success: true,
      data: requirements,
      metadata: {
        processingTime: Date.now() - Date.now(), // Will be very fast
        apiVersion: '1.0.0',
      },
    });
  } catch (error) {
    console.error('ASRS Decision Engine Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to process ASRS requirements',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return available configuration options for form building
    const configurations = await asrsEngine.getAvailableConfigurations();
    
    return NextResponse.json({
      success: true,
      data: configurations,
    });
  } catch (error) {
    console.error('ASRS Configurations Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get configurations',
      },
      { status: 500 }
    );
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

function validateInput(input: any): ValidationResult {
  const errors: string[] = [];

  if (!input.asrsType || !['Shuttle', 'Mini-Load'].includes(input.asrsType)) {
    errors.push('Valid ASRS type required (Shuttle or Mini-Load)');
  }

  if (!input.containerType || !['Closed-Top', 'Open-Top'].includes(input.containerType)) {
    errors.push('Valid container type required (Closed-Top or Open-Top)');
  }

  if (!input.rackDepth || typeof input.rackDepth !== 'number' || input.rackDepth <= 0) {
    errors.push('Valid rack depth required (positive number)');
  }

  if (!input.rackSpacing || typeof input.rackSpacing !== 'number' || input.rackSpacing <= 0) {
    errors.push('Valid rack spacing required (positive number)');
  }

  if (input.ceilingHeight && (typeof input.ceilingHeight !== 'number' || input.ceilingHeight <= 0)) {
    errors.push('Ceiling height must be positive if provided');
  }

  if (input.storageHeight && (typeof input.storageHeight !== 'number' || input.storageHeight <= 0)) {
    errors.push('Storage height must be positive if provided');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
