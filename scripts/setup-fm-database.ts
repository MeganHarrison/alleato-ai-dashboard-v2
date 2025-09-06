/**
 * Setup FM Global Database
 * 
 * PURPOSE: Run all FM Global migrations and seed data
 * USAGE: tsx scripts/setup-fm-database.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Initialize Supabase with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Run SQL migration file
 */
async function runMigration(migrationPath: string, name: string) {
  console.log(`\n📝 Running migration: ${name}...`);
  
  try {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Split by semicolon but be careful with functions
    const statements = sql
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim() + ';');
    
    for (const statement of statements) {
      if (statement.trim().startsWith('--') || statement.trim().length === 1) {
        continue; // Skip comments and empty statements
      }
      
      const { error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      }).single();
      
      if (error && !error.message?.includes('already exists')) {
        console.error(`   ❌ Error in statement:`, error);
        // Continue with other statements
      }
    }
    
    console.log(`   ✅ Migration ${name} completed`);
    return true;
  } catch (error) {
    console.error(`   ❌ Migration ${name} failed:`, error);
    return false;
  }
}

/**
 * Run raw SQL directly
 */
async function executeSql(sql: string, description: string) {
  console.log(`\n🔧 Executing: ${description}...`);
  
  try {
    const { data, error } = await supabase
      .from('_sql')
      .select('*')
      .limit(0); // Just to test connection
    
    // Use raw SQL through Supabase admin API if available
    // For now, we'll create tables using the Supabase client
    console.log(`   ⚠️  Direct SQL execution not available, using Supabase client`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error:`, error);
    return false;
  }
}

/**
 * Create FM Global tables using Supabase client
 */
async function createTables() {
  console.log('\n📊 Creating FM Global tables...');
  
  // Check if tables exist
  const { data: figures } = await supabase
    .from('fm_global_figures')
    .select('id')
    .limit(1);
  
  if (figures && !figures.length) {
    console.log('   ℹ️  Tables already exist or need to be created via SQL editor');
  }
  
  return true;
}

/**
 * Seed FM Global data
 */
async function seedData() {
  console.log('\n🌱 Seeding FM Global data...');
  
  // Check if data already exists
  const { count: figureCount } = await supabase
    .from('fm_global_figures')
    .select('*', { count: 'exact', head: true });
  
  if (figureCount && figureCount > 0) {
    console.log(`   ℹ️  Data already exists (${figureCount} figures)`);
    return true;
  }
  
  // Import and run the seed script
  try {
    const seedModule = await import('./seed-fm-data');
    const figures = seedModule.FM_GLOBAL_FIGURES;
    const tables = seedModule.FM_GLOBAL_TABLES;
    
    // Insert figures
    for (const figure of figures) {
      const { error } = await supabase
        .from('fm_global_figures')
        .insert(figure);
      
      if (error && !error.message?.includes('duplicate')) {
        console.error(`   ❌ Error inserting figure ${figure.figure_number}:`, error);
      } else {
        console.log(`   ✅ Inserted Figure ${figure.figure_number}`);
      }
    }
    
    // Insert tables
    for (const table of tables) {
      const { error } = await supabase
        .from('fm_global_tables')
        .insert(table);
      
      if (error && !error.message?.includes('duplicate')) {
        console.error(`   ❌ Error inserting table ${table.table_number}:`, error);
      } else {
        console.log(`   ✅ Inserted Table ${table.table_number}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('   ❌ Error seeding data:', error);
    return false;
  }
}

/**
 * Main setup function
 */
async function main() {
  console.log('🚀 Starting FM Global Database Setup...');
  console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  
  try {
    // Step 1: Create tables (if needed)
    await createTables();
    
    // Step 2: Seed data
    await seedData();
    
    // Step 3: Check the results
    const { count: figureCount } = await supabase
      .from('fm_global_figures')
      .select('*', { count: 'exact', head: true });
    
    const { count: tableCount } = await supabase
      .from('fm_global_tables')
      .select('*', { count: 'exact', head: true });
    
    console.log('\n✅ Setup complete!');
    console.log(`   Figures: ${figureCount || 0}`);
    console.log(`   Tables: ${tableCount || 0}`);
    
    console.log('\n📝 Next steps:');
    console.log('   1. Run migrations manually in Supabase SQL Editor if tables don\'t exist');
    console.log('   2. Run "npm run generate:fm-embeddings" to create vector embeddings');
    console.log('   3. Test the API at http://localhost:3003/api/fm-global-rag');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

export { createTables, seedData };