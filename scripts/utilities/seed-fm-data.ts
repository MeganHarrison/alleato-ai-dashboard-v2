/**
 * Seed FM Global Data to Supabase
 * 
 * PURPOSE: Insert all FM Global figures and tables into Supabase
 * USAGE: npm run fm:seed
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// FM Global Figures Data
const FM_GLOBAL_FIGURES = [
  {
    figure_number: 1,
    title: 'Shuttle ASRS - Closed-Top Container Configuration',
    description: 'Shows proper sprinkler layout for shuttle ASRS with closed-top containers. Standard wet pipe system with ceiling-level sprinklers at 5ft spacing.',
    asrs_type: 'shuttle',
    container_type: 'closed-top',
    max_spacing_ft: 5.0,
    max_depth_ft: 8.0,
    sprinkler_count: 12,
    page_reference: 45,
    requirements: ['K-11.2 sprinklers minimum', '4-inch clearance from storage', 'Wet pipe system preferred', 'Standard response sprinklers'],
    figure_type: 'Sprinkler Layout',
    normalized_summary: 'Standard protection scheme for shuttle ASRS with closed-top containers requiring ceiling-level sprinklers',
    machine_readable_claims: {
      max_rack_depth: 8,
      max_spacing: 5,
      sprinkler_count: 12,
      numbering: '1-12',
      container_type: 'Closed-Top',
      requires_flue_spaces: true,
      protection_level: 'Standard',
      applicable_commodities: ['Class 1-4', 'Cartoned Plastics']
    },
    search_keywords: ['shuttle', 'closed-top', 'wet pipe', 'K-11.2', 'standard protection', 'ceiling sprinklers']
  },
  {
    figure_number: 2,
    title: 'Shuttle ASRS - Open-Top Container Protection',
    description: 'Enhanced protection scheme for open-top containers including in-rack sprinklers. Requires both ceiling and in-rack protection systems.',
    asrs_type: 'shuttle',
    container_type: 'open-top',
    max_spacing_ft: 2.5,
    max_depth_ft: 6.0,
    sprinkler_count: 24,
    page_reference: 48,
    requirements: ['K-16.8 sprinklers required', 'In-rack sprinklers mandatory', 'Enhanced protection system', 'Quick response sprinklers'],
    figure_type: 'Sprinkler Layout',
    normalized_summary: 'Enhanced protection for shuttle ASRS with open-top containers requiring both ceiling and in-rack sprinklers',
    machine_readable_claims: {
      max_rack_depth: 6,
      max_spacing: 2.5,
      sprinkler_count: 24,
      numbering: '1-24',
      container_type: 'Open-Top',
      requires_flue_spaces: true,
      protection_level: 'Enhanced',
      applicable_commodities: ['All Classes', 'Exposed Plastics']
    },
    search_keywords: ['shuttle', 'open-top', 'in-rack', 'K-16.8', 'enhanced protection', 'IRAS', 'quick response']
  },
  {
    figure_number: 3,
    title: 'Mini-Load ASRS Standard Configuration',
    description: 'Standard protection for mini-load ASRS systems up to 25ft height. Ceiling-only protection sufficient for most applications.',
    asrs_type: 'mini-load',
    container_type: 'mixed',
    max_spacing_ft: 4.0,
    max_depth_ft: 4.0,
    max_height_ft: 25.0,
    sprinkler_count: 8,
    page_reference: 52,
    requirements: ['K-8.0 sprinklers acceptable', 'Ceiling protection only', 'Standard wet pipe system', '3ft minimum aisle width'],
    figure_type: 'System Diagram',
    normalized_summary: 'Standard mini-load ASRS configuration with ceiling-only protection for heights up to 25ft',
    machine_readable_claims: {
      max_rack_depth: 4,
      max_spacing: 4,
      max_height: 25,
      sprinkler_count: 8,
      container_type: 'Mixed',
      protection_level: 'Standard',
      aisle_width_min: 3
    },
    search_keywords: ['mini-load', 'ceiling-only', 'K-8.0', 'standard', '25ft', 'wet pipe']
  },
  {
    figure_number: 4,
    title: 'High-Rise ASRS Enhanced Protection',
    description: 'Enhanced protection requirements for ASRS systems over 25ft height. Multiple protection levels required.',
    asrs_type: 'shuttle',
    container_type: 'mixed',
    max_spacing_ft: 3.0,
    max_height_ft: 40.0,
    sprinkler_count: 32,
    page_reference: 58,
    requirements: ['K-25.2 sprinklers for upper levels', 'Multi-level protection zones', 'Enhanced water supply', 'Fast response sprinklers mandatory'],
    figure_type: 'Sprinkler Layout',
    normalized_summary: 'High-rise ASRS protection scheme with multi-level sprinkler zones for systems over 25ft',
    machine_readable_claims: {
      max_height: 40,
      max_spacing: 3,
      sprinkler_count: 32,
      protection_zones: 3,
      upper_k_factor: 'K-25.2',
      protection_level: 'High-Rise Enhanced'
    },
    search_keywords: ['high-rise', 'multi-level', 'K-25.2', 'enhanced', '40ft', 'zones', 'fast response']
  }
];

// FM Global Tables Data
const FM_GLOBAL_TABLES = [
  {
    table_number: 1,
    table_id: 'table_1',
    title: 'ASRS Sprinkler K-Factor Requirements',
    description: 'Minimum K-factor requirements based on commodity class and container type for ASRS applications.',
    section: 'Sprinkler Requirements',
    asrs_type: 'all',
    data: {
      'Class I Closed-Top': 'K-8.0 minimum',
      'Class I Open-Top': 'K-11.2 minimum',
      'Class II Closed-Top': 'K-11.2 minimum',
      'Class II Open-Top': 'K-16.8 minimum',
      'Class III/IV Any': 'K-25.2 minimum',
      'Plastics Closed-Top': 'K-16.8 minimum',
      'Plastics Open-Top': 'K-25.2 minimum'
    },
    page_reference: 32,
    commodity_types: 'Class I, Class II, Class III, Class IV, Plastics',
    protection_scheme: 'wet',
    system_type: 'wet'
  },
  {
    table_number: 2,
    table_id: 'table_2',
    title: 'Maximum Sprinkler Spacing by System Type',
    description: 'Maximum allowable sprinkler spacing for different ASRS configurations and protection schemes.',
    section: 'Spacing Requirements',
    asrs_type: 'all',
    data: {
      'Shuttle ASRS Closed-Top': '5.0 ft maximum',
      'Shuttle ASRS Open-Top': '2.5 ft maximum',
      'Mini-Load Standard': '4.0 ft maximum',
      'High-Rise (>25ft)': '3.0 ft maximum',
      'In-Rack Systems': '2.0 ft maximum'
    },
    page_reference: 38,
    commodity_types: 'All Commodities',
    protection_scheme: 'wet',
    system_type: 'wet'
  },
  {
    table_number: 3,
    table_id: 'table_3',
    title: 'Water Supply Pressure Requirements',
    description: 'Minimum water supply pressure requirements at the base of riser for different ASRS protection schemes.',
    section: 'Water Supply',
    asrs_type: 'all',
    data: {
      'Standard Wet Pipe': '50 PSI minimum',
      'Enhanced Protection': '75 PSI minimum',
      'In-Rack Systems': '100 PSI minimum',
      'Dry Pipe Systems': '65 PSI minimum',
      'High-Rise (>30ft)': '125 PSI minimum'
    },
    page_reference: 42,
    commodity_types: 'All Commodities',
    protection_scheme: 'all',
    system_type: 'all'
  },
  {
    table_number: 4,
    table_id: 'table_4',
    title: 'Commodity Classification Guidelines',
    description: 'Classification requirements for different product types in ASRS storage applications.',
    section: 'Commodity Classification',
    asrs_type: 'all',
    data: {
      'Paper Products': 'Class I-II depending on packaging',
      'Metal Parts': 'Class I typically',
      'Cartoned Plastics': 'Class IV minimum',
      'Expanded Plastics': 'Special requirements apply',
      'Aerosols': 'High Hazard - Special protection',
      'Flammable Liquids': 'Specialized systems required'
    },
    page_reference: 28,
    commodity_types: 'Paper, Metal, Plastics, Aerosols, Flammable Liquids',
    protection_scheme: 'varies',
    system_type: 'all'
  }
];

/**
 * Clear existing data and insert new FM Global figures
 */
async function seedFigures() {
  console.log('🗑️  Clearing existing figures...');
  
  // Clear existing data
  const { error: deleteError } = await supabase
    .from('fm_global_figures')
    .delete()
    .lte('figure_number', 50);
  
  if (deleteError) {
    console.error('Error clearing figures:', deleteError);
  }
  
  console.log('📊 Inserting FM Global figures...');
  
  for (const figure of FM_GLOBAL_FIGURES) {
    const { error } = await supabase
      .from('fm_global_figures')
      .insert({
        ...figure,
        metadata: {
          cost_impact: 'high',
          optimization_potential: true,
          common_issues: ['spacing violations', 'incorrect K-factor', 'missing in-rack'],
          inspection_points: ['clearance', 'obstruction', 'orientation']
        }
      });
    
    if (error) {
      console.error(`Error inserting figure ${figure.figure_number}:`, error);
    } else {
      console.log(`✅ Inserted Figure ${figure.figure_number}: ${figure.title}`);
    }
  }
}

/**
 * Clear existing data and insert new FM Global tables
 */
async function seedTables() {
  console.log('\n🗑️  Clearing existing tables...');
  
  // Clear existing data
  const { error: deleteError } = await supabase
    .from('fm_global_tables')
    .delete()
    .lte('table_number', 50);
  
  if (deleteError) {
    console.error('Error clearing tables:', deleteError);
  }
  
  console.log('📊 Inserting FM Global tables...');
  
  for (const table of FM_GLOBAL_TABLES) {
    const { error } = await supabase
      .from('fm_global_tables')
      .insert({
        ...table,
        design_parameters: {
          calculation_method: 'density/area',
          safety_factor: 1.2,
          includes_hose_stream: true,
          remote_area_location: 'hydraulically most demanding'
        },
        sprinkler_specifications: {
          temperature_rating: '165°F standard',
          orientation: 'pendent or upright',
          listing: 'FM Approved',
          coverage_area: '100-130 sq ft'
        },
        metadata: {
          version: '8-34',
          last_updated: '2024',
          compliance_level: 'FM Global Standard'
        }
      });
    
    if (error) {
      console.error(`Error inserting table ${table.table_number}:`, error);
    } else {
      console.log(`✅ Inserted Table ${table.table_number}: ${table.title}`);
    }
  }
}

/**
 * Main function to seed all data
 */
async function main() {
  console.log('🚀 Starting FM Global data seeding...');
  console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    // Seed figures
    await seedFigures();
    
    // Seed tables
    await seedTables();
    
    console.log('\n✅ Data seeding complete!');
    
    // Verify the data
    const { count: figureCount } = await supabase
      .from('fm_global_figures')
      .select('*', { count: 'exact', head: true });
    
    const { count: tableCount } = await supabase
      .from('fm_global_tables')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total figures: ${figureCount}`);
    console.log(`   Total tables: ${tableCount}`);
    
    console.log('\n💡 Next steps:');
    console.log('   1. Run "npm run generate:fm-embeddings" to create vector embeddings');
    console.log('   2. Test the RAG API at /api/fm-global-rag');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { FM_GLOBAL_FIGURES, FM_GLOBAL_TABLES };