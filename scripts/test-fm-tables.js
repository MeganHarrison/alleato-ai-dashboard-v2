const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFMTables() {
  console.log('Testing FM Global tables connection...\n');

  // Test figures
  console.log('Fetching FM Global figures...');
  const { data: figures, error: figuresError } = await supabase
    .from('fm_global_figures')
    .select('*')
    .limit(3);

  if (figuresError) {
    console.error('Error fetching figures:', figuresError);
  } else {
    console.log(`Found ${figures?.length || 0} figures`);
    if (figures && figures.length > 0) {
      console.log('Sample figure:', {
        id: figures[0].id,
        figure_number: figures[0].figure_number,
        title: figures[0].title,
        columns: Object.keys(figures[0])
      });
    }
  }

  console.log('\n---\n');

  // Test tables
  console.log('Fetching FM Global tables...');
  const { data: tables, error: tablesError } = await supabase
    .from('fm_global_tables')
    .select('*')
    .limit(3);

  if (tablesError) {
    console.error('Error fetching tables:', tablesError);
  } else {
    console.log(`Found ${tables?.length || 0} tables`);
    if (tables && tables.length > 0) {
      console.log('Sample table:', {
        id: tables[0].id,
        table_number: tables[0].table_number,
        title: tables[0].title,
        columns: Object.keys(tables[0])
      });
    }
  }

  console.log('\n---\n');

  // Test search for Table 27
  console.log('Searching for Table 27...');
  const { data: table27, error: table27Error } = await supabase
    .from('fm_global_tables')
    .select('*')
    .or('table_number.ilike.%27%,title.ilike.%27%');

  if (table27Error) {
    console.error('Error searching for Table 27:', table27Error);
  } else {
    console.log(`Found ${table27?.length || 0} results for "27"`);
    if (table27 && table27.length > 0) {
      console.log('Results:', table27.map(t => ({
        table_number: t.table_number,
        title: t.title
      })));
    }
  }

  process.exit(0);
}

testFMTables().catch(console.error);