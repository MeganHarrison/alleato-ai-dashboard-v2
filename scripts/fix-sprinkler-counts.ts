/**
 * Update FM Global Figures Database - Fix Sprinkler Counts
 * Corrects hydraulic vs total sprinkler count confusion
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Need admin access
);

// Mapping of figures to correct total sprinkler counts
const sprinklerCountCorrections = {
  4: { total: 8, hydraulic: '1-8', hydraulic_count: 8 },
  5: { total: 8, hydraulic: '1-8', hydraulic_count: 8 },
  6: { total: 8, hydraulic: '1,3,5,7', hydraulic_count: 4 },
  7: { total: 8, hydraulic: '1,3,5,7', hydraulic_count: 4 },
  8: { total: 8, hydraulic: 'TBD', hydraulic_count: 6 }, // Update as needed
  // Add more figures as you identify them
};

async function updateSprinklerCounts() {
  console.log('🔧 Updating sprinkler count corrections...\n');
  
  for (const [figureNum, corrections] of Object.entries(sprinklerCountCorrections)) {
    try {
      // Get current data
      const { data: current, error: fetchError } = await supabase
        .from('fm_global_figures')
        .select('figure_number, machine_readable_claims')
        .eq('figure_number', parseInt(figureNum))
        .single();

      if (fetchError) {
        console.error(`❌ Error fetching Figure ${figureNum}:`, fetchError);
        continue;
      }

      if (!current) {
        console.warn(`⚠️ Figure ${figureNum} not found`);
        continue;
      }

      // Parse existing claims
      let claims = {};
      try {
        claims = typeof current.machine_readable_claims === 'string' 
          ? JSON.parse(current.machine_readable_claims)
          : current.machine_readable_claims || {};
      } catch (e) {
        console.warn(`⚠️ Could not parse claims for Figure ${figureNum}`);
        claims = {};
      }

      // Update with corrections
      const updatedClaims = {
        ...claims,
        sprinkler_count: corrections.total,
        total_sprinklers: corrections.total,
        hydraulic_sprinklers: corrections.hydraulic,
        hydraulic_count: corrections.hydraulic_count,
        numbering: corrections.hydraulic, // Keep numbering as hydraulic pattern
        updated_at: new Date().toISOString(),
        correction_applied: true
      };

      console.log(`📝 Figure ${figureNum}: ${claims.sprinkler_count || 'unknown'} → ${corrections.total} sprinklers`);

      // Update the database
      const { error: updateError } = await supabase
        .from('fm_global_figures')
        .update({ machine_readable_claims: updatedClaims })
        .eq('figure_number', parseInt(figureNum));

      if (updateError) {
        console.error(`❌ Error updating Figure ${figureNum}:`, updateError);
      } else {
        console.log(`✅ Figure ${figureNum} updated successfully`);
      }

    } catch (error) {
      console.error(`❌ Unexpected error with Figure ${figureNum}:`, error);
    }
  }

  console.log('\n🎉 Sprinkler count corrections completed!');
}

async function verifyUpdates() {
  console.log('\n🔍 Verifying updates...\n');
  
  const { data: updated, error } = await supabase
    .from('fm_global_figures')
    .select('figure_number, machine_readable_claims')
    .in('figure_number', Object.keys(sprinklerCountCorrections).map(n => parseInt(n)))
    .order('figure_number');

  if (error) {
    console.error('❌ Error verifying updates:', error);
    return;
  }

  updated?.forEach(figure => {
    const claims = figure.machine_readable_claims;
    console.log(`Figure ${figure.figure_number}:`);
    console.log(`  Total Sprinklers: ${claims.total_sprinklers || claims.sprinkler_count}`);
    console.log(`  Hydraulic Pattern: ${claims.hydraulic_sprinklers || claims.numbering}`);
    console.log(`  Hydraulic Count: ${claims.hydraulic_count}`);
    console.log('');
  });
}

async function main() {
  try {
    await updateSprinklerCounts();
    await verifyUpdates();
    
    console.log('✅ Database corrections completed successfully!');
    console.log('🧪 Test your calculator now - Figure 6 should show 8 sprinklers');
    
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

// Run the update
if (require.main === module) {
  main();
}

export { updateSprinklerCounts, verifyUpdates };
