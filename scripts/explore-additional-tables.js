const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function exploreAdditionalTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  console.log('🔍 Exploring additional business tables...');
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    // Explore companies table
    console.log('\n🏢 COMPANIES TABLE:');
    const { data: companies, error: compError } = await supabase
      .from('companies')
      .select('*')
      .limit(3);

    if (compError) {
      console.error('❌ Error querying companies table:', compError.message);
    } else {
      console.log(`Found ${companies?.length || 0} company records:`);
      if (companies && companies.length > 0) {
        companies.forEach((company, index) => {
          console.log(`\nCompany ${index + 1}:`);
          console.log(JSON.stringify(company, null, 2));
        });
      }
    }

    // Explore contacts table
    console.log('\n📞 CONTACTS TABLE:');
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('*')
      .limit(5);

    if (contactError) {
      console.error('❌ Error querying contacts table:', contactError.message);
    } else {
      console.log(`Found ${contacts?.length || 0} contact records:`);
      if (contacts && contacts.length > 0) {
        contacts.forEach((contact, index) => {
          console.log(`\nContact ${index + 1}:`);
          console.log(JSON.stringify(contact, null, 2));
        });
      }
    }

    // Get counts for all tables
    console.log('\n📊 TABLE RECORD COUNTS:');
    const tables = ['employees', 'users', 'profiles', 'companies', 'contacts', 'projects', 'meetings', 'documents'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`  ${table}: ${count} records`);
        }
      } catch (e) {
        console.log(`  ${table}: unable to count`);
      }
    }

  } catch (error) {
    console.error('❌ Error exploring additional tables:', error.message);
  }
}

exploreAdditionalTables();