/**
 * FM Global Form Processing Sub-Route
 * 
 * PURPOSE: Processes ASRS requirement form submissions
 * 
 * USED BY:
 * - /fm-global-form page (FM Global requirements form)
 * - ASRS design form components
 * 
 * FUNCTIONALITY:
 * - Validates and processes ASRS form data
 * - Stores form submissions in Supabase
 * - Generates recommendations based on form inputs
 * - Returns structured analysis of ASRS requirements
 * 
 * INPUT: ASRSFormData (building details, storage info, system requirements)
 * OUTPUT: { success: boolean, analysis: object, recommendations: [] }
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ASRSFormData {
  asrs_type?: 'Shuttle' | 'Mini-Load' | 'Horizontal Carousel';
  container_type?: 'Closed-Top' | 'Open-Top' | 'Mixed';
  rack_depth_ft?: number;
  rack_spacing_ft?: number;
  ceiling_height_ft?: number;
  aisle_width_ft?: number;
  commodity_type?: string[];
  storage_height_ft?: number;
  system_type?: 'wet' | 'dry' | 'both';
  building_type?: string;
  sprinkler_coverage?: 'standard' | 'extended';
  expected_throughput?: 'low' | 'medium' | 'high';
}

export async function POST(req: Request) {
  console.log('=== FM GLOBAL FORM API CALLED ===');
  
  try {
    const formData: ASRSFormData = await req.json();
    console.log('Received form data:', JSON.stringify(formData, null, 2));
    
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables missing!');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'MISSING');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'MISSING');
      throw new Error('Database configuration missing');
    }
    
    // Convert form data to agent-compatible format
    const classification = {
      asrs_type: formData.asrs_type?.toLowerCase().replace('-', '_') || 'shuttle',
      container_type: formData.container_type?.toLowerCase().replace('-', '_') || 'closed_top',
      commodity_class: formData.commodity_type?.[0]?.replace('Class ', '') || '2',
      ceiling_height_ft: formData.ceiling_height_ft || 40,
      storage_height_ft: formData.storage_height_ft || 35,
      aisle_width_ft: formData.aisle_width_ft || formData.rack_spacing_ft || 4,
      rack_depth_ft: formData.rack_depth_ft || 6,
      system_type: formData.system_type || 'wet'
    };
    
    console.log('Classification:', JSON.stringify(classification, null, 2));
    
    // Query FM Global database
    console.log('Querying fm_global_tables with:', {
      asrs_type: classification.asrs_type,
      system_type: classification.system_type,
      commodity_class: classification.commodity_class,
      ceiling_height: classification.ceiling_height_ft
    });
    
    const { data: tables, error: tablesError } = await supabase
      .from('fm_global_tables')
      .select('*')
      .eq('asrs_type', classification.asrs_type)
      .eq('system_type', classification.system_type)
      .contains('commodity_types', [classification.commodity_class])
      .lte('ceiling_height_min_ft', classification.ceiling_height_ft)
      .gte('ceiling_height_max_ft', classification.ceiling_height_ft);
    
    if (tablesError) {
      console.error('Error querying fm_global_tables:', tablesError);
      throw new Error(`Database query failed: ${tablesError.message}`);
    }
    
    console.log(`Found ${tables?.length || 0} tables`);

    const { data: sprinklerConfigs, error: sprinklerError } = await supabase
      .from('fm_sprinkler_configs')
      .select('*')
      .eq('ceiling_height_ft', Math.round(classification.ceiling_height_ft));
    
    if (sprinklerError) {
      console.error('Error querying fm_sprinkler_configs:', sprinklerError);
      throw new Error(`Sprinkler config query failed: ${sprinklerError.message}`);
    }
    
    console.log(`Found ${sprinklerConfigs?.length || 0} sprinkler configs`);

    const { data: optimizationRules, error: optError } = await supabase
      .from('fm_optimization_rules')
      .select('*')
      .limit(3);
    
    // Generate specification
    const commodityDisplay = `Class ${classification.commodity_class}`;
    const requiresInRack = classification.container_type === 'open_top' || formData.container_type === 'Open-Top';
    
    const specification = {
      systemConfiguration: classification,
      applicableTables: tables?.map(t => `Table ${t.table_number}: ${t.title}`) || [],
      applicableFigures: tables?.flatMap(t => t.applicable_figures || []) || [],
      sprinklerCount: requiresInRack ? 36 : 24,
      protectionScheme: `${classification.system_type === 'wet' ? 'Wet' : 'Dry'} pipe system with ${requiresInRack ? 'ceiling and in-rack' : 'ceiling-only'} protection`,
      ceilingProtection: {
        kFactor: sprinklerConfigs?.[0]?.k_factor || 'K16.8',
        temperature: sprinklerConfigs?.[0]?.temperature_rating || '160°F',
        response: sprinklerConfigs?.[0]?.response_type || 'quick-response',
        orientation: sprinklerConfigs?.[0]?.orientation || 'pendent',
        sprinklerCount: sprinklerConfigs?.[0]?.sprinkler_count || 12,
        pressurePsi: sprinklerConfigs?.[0]?.pressure_psi || 25,
        coverageType: formData.sprinkler_coverage || 'standard',
        spacing: '10 ft x 10 ft',
        designAreaSqft: sprinklerConfigs?.[0]?.design_area_sqft || 768
      },
      inRackProtection: requiresInRack ? {
        required: true,
        reason: classification.container_type === 'open_top' ? 
          'Open-top containers require in-rack sprinkler protection' : 
          'Mixed container types require in-rack protection for open-top areas',
        sprinklerType: 'K8.0, 160°F quick-response storage sprinklers',
        verticalSpacing: '8-foot maximum between levels',
        reference: 'FM Global 8-34 Section 2.2.3.2'
      } : null,
      hydraulicDesign: {
        totalGpm: requiresInRack ? 1350 : 1050,
        hoseGpm: 500,
        durationMin: 90,
        residualPsi: 20
      },
      costEstimate: {
        sprinklers: {
          count: requiresInRack ? 36 : 24,
          unitCost: 95,
          total: (requiresInRack ? 36 : 24) * 95
        },
        piping: {
          feet: requiresInRack ? 240 : 180,
          unitCost: 15.5,
          total: (requiresInRack ? 240 : 180) * 15.5
        },
        labor: {
          total: requiresInRack ? 18500 : 13500
        },
        equipment: {
          total: requiresInRack ? 11200 : 8200
        },
        total: (requiresInRack ? 36 : 24) * 95 + 
               (requiresInRack ? 240 : 180) * 15.5 + 
               (requiresInRack ? 18500 : 13500) + 
               (requiresInRack ? 11200 : 8200)
      },
      optimizationOpportunities: optimizationRules?.map(rule => ({
        description: rule.description,
        costImpact: rule.cost_impact,
        conditionTo: rule.condition_to
      })) || []
    };
    
    // Save form submission
    const { data: submission } = await supabase
      .from('fm_form_submissions')
      .insert({
        user_input: formData,
        parsed_requirements: classification,
        recommendations: specification,
        matched_table_ids: tables?.map(t => t.table_id) || []
      })
      .select()
      .single();
    
    return NextResponse.json({
      success: true,
      submissionId: submission?.id,
      specification
    });
    
  } catch (error) {
    console.error('=== FORM API ERROR ===');
    console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          message: errorMessage,
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      },
      { status: 500 }
    );
  }
}