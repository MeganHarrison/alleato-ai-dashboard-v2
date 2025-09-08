/**
 * Generate FM Global Vector Embeddings
 * 
 * PURPOSE: Generate OpenAI embeddings for all FM Global figures and tables
 * USAGE: npm run generate-fm-embeddings
 */

import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface FMFigure {
  id: string;
  figure_number: number;
  title: string;
  description: string | null;
  asrs_type: string | null;
  container_type: string | null;
  requirements: string[] | null;
  normalized_summary: string | null;
}

interface FMTable {
  id: string;
  table_number: number;
  table_id: string;
  title: string;
  description: string | null;
  commodity_types: string | null;
  protection_scheme: string | null;
  data: any;
}

/**
 * Generate embedding for a text string using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Create searchable text from figure data
 */
function createFigureSearchText(figure: FMFigure): string {
  const parts = [
    `Figure ${figure.figure_number}: ${figure.title}`,
    figure.description || '',
    figure.normalized_summary || '',
    `ASRS Type: ${figure.asrs_type || 'all'}`,
    `Container Type: ${figure.container_type || 'all'}`,
  ];
  
  if (figure.requirements && figure.requirements.length > 0) {
    parts.push(`Requirements: ${figure.requirements.join(', ')}`);
  }
  
  return parts.filter(Boolean).join(' | ');
}

/**
 * Create searchable text from table data
 */
function createTableSearchText(table: FMTable): string {
  const parts = [
    `Table ${table.table_number}: ${table.title}`,
    table.description || '',
    `ASRS Type: ${table.asrs_type || 'all'}`,
    `Commodities: ${table.commodity_types || 'all'}`,
    `Protection: ${table.protection_scheme || 'standard'}`,
  ];
  
  // Add data entries if available
  if (table.data && typeof table.data === 'object') {
    const dataEntries = Object.entries(table.data)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    parts.push(`Data: ${dataEntries}`);
  }
  
  return parts.filter(Boolean).join(' | ');
}

/**
 * Update embeddings for all FM Global figures
 */
async function updateFigureEmbeddings() {
  console.log('🔄 Fetching FM Global figures...');
  
  const { data: figures, error } = await supabase
    .from('fm_global_figures')
    .select('*')
    .order('figure_number');
  
  if (error) {
    console.error('Error fetching figures:', error);
    return;
  }
  
  console.log(`📊 Found ${figures?.length || 0} figures to process`);
  
  for (const figure of figures || []) {
    try {
      const searchText = createFigureSearchText(figure);
      console.log(`\n🔍 Processing Figure ${figure.figure_number}: ${figure.title}`);
      console.log(`   Search text: ${searchText.substring(0, 100)}...`);
      
      // Generate embedding
      const embedding = await generateEmbedding(searchText);
      console.log(`   ✅ Generated embedding (dimension: ${embedding.length})`);
      
      // Update in database
      const { error: updateError } = await supabase
        .from('fm_global_figures')
        .update({ 
          embedding: embedding,
          normalized_summary: figure.normalized_summary || searchText.substring(0, 500),
          updated_at: new Date().toISOString()
        })
        .eq('id', figure.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating figure ${figure.figure_number}:`, updateError);
      } else {
        console.log(`   ✅ Updated Figure ${figure.figure_number} with embedding`);
      }
      
      // Rate limiting - OpenAI allows 3000 RPM for embeddings
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error processing figure ${figure.figure_number}:`, error);
    }
  }
}

/**
 * Update embeddings for all FM Global tables
 */
async function updateTableEmbeddings() {
  console.log('\n🔄 Fetching FM Global tables...');
  
  const { data: tables, error } = await supabase
    .from('fm_global_tables')
    .select('*')
    .order('table_number');
  
  if (error) {
    console.error('Error fetching tables:', error);
    return;
  }
  
  console.log(`📊 Found ${tables?.length || 0} tables to process`);
  
  for (const table of tables || []) {
    try {
      const searchText = createTableSearchText(table);
      console.log(`\n🔍 Processing Table ${table.table_number}: ${table.title}`);
      console.log(`   Search text: ${searchText.substring(0, 100)}...`);
      
      // Generate embedding
      const embedding = await generateEmbedding(searchText);
      console.log(`   ✅ Generated embedding (dimension: ${embedding.length})`);
      
      // Update in database
      const { error: updateError } = await supabase
        .from('fm_global_tables')
        .update({ 
          embedding: embedding,
          updated_at: new Date().toISOString()
        })
        .eq('id', table.id);
      
      if (updateError) {
        console.error(`   ❌ Error updating table ${table.table_number}:`, updateError);
      } else {
        console.log(`   ✅ Updated Table ${table.table_number} with embedding`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.error(`❌ Error processing table ${table.table_number}:`, error);
    }
  }
}

/**
 * Main function to generate all embeddings
 */
async function main() {
  console.log('🚀 Starting FM Global embedding generation...');
  console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔑 OpenAI API Key:', process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing');
  
  try {
    // Generate embeddings for figures
    await updateFigureEmbeddings();
    
    // Generate embeddings for tables
    await updateTableEmbeddings();
    
    console.log('\n✅ Embedding generation complete!');
    
    // Verify the embeddings
    const { data: figureCount } = await supabase
      .from('fm_global_figures')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null);
    
    const { data: tableCount } = await supabase
      .from('fm_global_tables')
      .select('id', { count: 'exact', head: true })
      .not('embedding', 'is', null);
    
    console.log(`\n📊 Summary:`);
    console.log(`   Figures with embeddings: ${figureCount}`);
    console.log(`   Tables with embeddings: ${tableCount}`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { generateEmbedding, createFigureSearchText, createTableSearchText };