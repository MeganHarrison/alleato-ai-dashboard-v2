/**
 * Populate Existing Supabase Tables with CSV Data
 * Uses your existing table structure
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin operations
);

interface FigureRow {
  figure_number: number;
  asrs_type: string;
  container_type: string;
  max_depth_ft: number;
  max_spacing_ft: number;
  machine_readable_claims: string;
  page_number: number;
  title: string;
}

function parseCSV(csvContent: string): any[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  const data: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      const row: any = {};
      headers.forEach((header, index) => {
        let value = values[index] ? values[index].replace(/"/g, '').trim() : '';
        if (!isNaN(Number(value)) && value !== '') {
          value = parseFloat(value);
        }
        row[header] = value;
      });
      data.push(row);
    }
  }
  
  return data;
}

async function populateDecisionMatrix(figuresData: FigureRow[]) {
  console.log('🔧 Populating asrs_decision_matrix table...');
  
  const configurations: any[] = [];
  let processedCount = 0;

  figuresData.forEach(figure => {
    // Only process design figures (not navigation)
    if (!figure.asrs_type || figure.asrs_type === 'All' || 
        !figure.max_depth_ft || !figure.max_spacing_ft) {
      return;
    }

    let claims: any = {};
    try {
      claims = JSON.parse(figure.machine_readable_claims || '{}');
    } catch (e) {
      console.warn(`Could not parse claims for figure ${figure.figure_number}`);
    }

    configurations.push({
      configuration_key: `${figure.asrs_type}_${figure.container_type}_${figure.max_depth_ft}_${figure.max_spacing_ft}`,
      asrs_type: figure.asrs_type,
      container_type: figure.container_type,
      rack_depth_ft: figure.max_depth_ft,
      rack_spacing_ft: figure.max_spacing_ft,
      applicable_figure: figure.figure_number,
      applicable_table: 14, // Default table - you can enhance this logic
      sprinkler_count: claims.sprinkler_count || 0,
      sprinkler_numbering: claims.numbering || '',
      requires_flue_spaces: claims.requires_flue_spaces || false,
      requires_vertical_barriers: claims.requires_vertical_barriers || false,
      complexity_score: claims.sprinkler_count > 6 ? 3 : (claims.sprinkler_count > 4 ? 2 : 1),
      page_reference: figure.page_number,
      figure_title: figure.title
    });
    
    processedCount++;
  });

  // Insert configurations into database
  const { data, error } = await supabase
    .from('asrs_decision_matrix')
    .upsert(configurations, { 
      onConflict: 'configuration_key',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error inserting into asrs_decision_matrix:', error);
    throw error;
  }

  console.log(`✅ Processed ${processedCount} configurations`);
  return configurations.length;
}

async function populateFiguresTable(figuresData: FigureRow[]) {
  console.log('🔧 Populating fm_global_figures table...');
  
  const figures: any[] = figuresData.map(figure => ({
    figure_number: figure.figure_number,
    title: figure.title,
    clean_caption: figure.title,
    normalized_summary: `ASRS ${figure.asrs_type} system with ${figure.container_type} containers`,
    figure_type: figure.asrs_type === 'All' ? 'Navigation/Decision Tree' : 'Sprinkler Layout',
    asrs_type: figure.asrs_type,
    container_type: figure.container_type,
    max_depth_ft: figure.max_depth_ft,
    max_spacing_ft: figure.max_spacing_ft,
    machine_readable_claims: figure.machine_readable_claims ? JSON.parse(figure.machine_readable_claims) : {},
    page_number: figure.page_number,
    search_keywords: [
      figure.asrs_type?.toLowerCase(),
      figure.container_type?.toLowerCase(),
      'sprinkler',
      'ASRS',
      'FM Global'
    ].filter(Boolean)
  }));

  const { data, error } = await supabase
    .from('fm_global_figures')
    .upsert(figures, { 
      onConflict: 'figure_number',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error inserting into fm_global_figures:', error);
    throw error;
  }

  console.log(`✅ Updated ${figures.length} figures`);
  return figures.length;
}

async function createOptimizationRules() {
  console.log('🔧 Creating optimization rules...');
  
  const rules = [
    {
      rule_name: 'Reduce Sprinkler Count - Spacing Increase',
      condition_type: 'spacing',
      trigger_conditions: { min_sprinkler_count: 6 },
      optimization_type: 'cost_reduction',
      recommendation: 'Consider increasing rack spacing to reduce sprinkler count',
      potential_savings_pct: 25.0,
      implementation_complexity: 2,
      priority_level: 'high'
    },
    {
      rule_name: 'Container Type Optimization',
      condition_type: 'container',
      trigger_conditions: { container_type: 'Open-Top' },
      optimization_type: 'cost_reduction',
      recommendation: 'Closed-top containers reduce protection requirements',
      potential_savings_pct: 15.0,
      implementation_complexity: 3,
      priority_level: 'medium'
    },
    {
      rule_name: 'Rack Depth Optimization',
      condition_type: 'depth',
      trigger_conditions: { min_rack_depth: 9 },
      optimization_type: 'compliance_improvement',
      recommendation: 'Consider reducing rack depth to avoid complex protection schemes',
      potential_savings_pct: 20.0,
      implementation_complexity: 4,
      priority_level: 'medium'
    }
  ];

  const { data, error } = await supabase
    .from('design_optimization_rules')
    .upsert(rules, { ignoreDuplicates: true });

  if (error) {
    console.error('Error creating optimization rules:', error);
    throw error;
  }

  console.log(`✅ Created ${rules.length} optimization rules`);
}

async function main() {
  try {
    console.log('📥 Starting database population...\\n');

    // Check if we have environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
    }

    // Define file paths
    const dataDir = join(process.cwd(), 'data');
    const figuresPath = join(dataDir, 'fm_global_figures_rows.csv');
    
    // Check if CSV file exists
    try {
      const figuresCSV = readFileSync(figuresPath, 'utf8');
      
      console.log('📖 Reading CSV data...');
      const figuresData = parseCSV(figuresCSV);
      
      console.log(`Found ${figuresData.length} figure records\\n`);
      
      // Populate database tables
      const decisionMatrixCount = await populateDecisionMatrix(figuresData);
      const figuresCount = await populateFiguresTable(figuresData);
      await createOptimizationRules();
      
      console.log('\\n✅ Database population completed successfully!');
      console.log(`📊 Decision Matrix: ${decisionMatrixCount} configurations`);
      console.log(`📋 Figures: ${figuresCount} entries`);
      console.log(`🔧 Optimization Rules: Created`);
      
      console.log('\\n🎯 Next Steps:');
      console.log('1. Update your API route to use: asrs-decision-engine-db.ts');
      console.log('2. Test the calculator: /asrs-requirements-calculator');
      console.log('3. Verify database lookups are working');

    } catch (fileError) {
      console.error(`❌ Could not read CSV file: ${figuresPath}`);
      console.error('💡 Make sure you copied the CSV files to the data directory');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Population failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}
