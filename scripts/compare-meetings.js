const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Meetings from the file (last 50 meetings)
const fireflyMeetings = [
  { date: 1756935000000, title: "Uniqlo+Alleato Group", id: "01K3TV2JK24MS22PV821GNEW1N" },
  { date: 1756929600000, title: "FW: Project Volleyball update", id: "01K3TV2JGY3YKRVME6DSN76N4Q" },
  { date: 1756920600000, title: "Daily TB", id: "01K43678YSJG87CJVVN6GFMND8" },
  { date: 1756917000000, title: "Insurance", id: "01K47WN5BCKYG28V9XJBX8PWTG" },
  { date: 1756904400000, title: "Executive Weekly meeting", id: "01K3TV2JH1WDSSQC1JN3E6NBTD" },
  { date: 1756841400000, title: "Weekly Company Operations Meeting", id: "01K45BGNBFKGFR3FXDSEFQDKWH" },
  { date: 1756836000000, title: "Weekly Accounting Meeting", id: "01K3TV2JH42NRS3M3E7XZ8MTTS" },
  { date: 1756834200000, title: "AI + Alleato Group follow-up", id: "01K3TV2JG99A3CM28FPNG3PQ9E" },
  { date: 1756823400000, title: "Goodwill Bloomington Morning Meeting", id: "01K3TV2JJXQTK3XWDHTP95JRYX" },
  { date: 1756819800000, title: "Meeting with Jim Parker", id: "01K455GF455SED2MPCYA2JPY1T" },
  { date: 1756490400000, title: "GWB TB", id: "01K3V5W3MHX24Z7FN595TM5333" },
  { date: 1756477800000, title: "Goodwill Bloomington Morning Meeting", id: "01K3P855FPJDB0S5TDEFT2HBP5" },
  { date: 1756407600000, title: "Alleato Group Taxes 2024", id: "01K3M58HTCCAR3G7BGZ6BFS6B4" },
  { date: 1756404900000, title: "GW Bloomington Meeting", id: "01K3RW19QEQ4W7XDT9V7EEP2WR" },
  { date: 1756404000000, title: "Ulta Fresno+ Alleato Group", id: "01K3PN04MFWSVGDEA27T874MYK" },
  { date: 1756395000000, title: "Update on Excel sheet (owner billing )", id: "01K3PMY4MGDB8DXSKX7X1HVKWE" },
  { date: 1756393200000, title: "AI tools list overview", id: "01K3M0V1P0177PDST7R2MV9PRK" },
  { date: 1756389600000, title: "Niemann+Alleato Weekly", id: "01K374MAS9AWHPB390DRFWJEN0" },
  { date: 1756330200000, title: "Uniqlo+Alleato Group", id: "01K374MAQ92EM6Z9BVXT12AT7W" },
  { date: 1756303200000, title: "Review Monthly Monitoring for Subcon Billing", id: "01K3NN3N9JVQD2AG07TZ5X2P2B" },
  { date: 1756301400000, title: "Executive Weekly meeting", id: "01K3NTP785P92CT2DT776VT0G2" },
  { date: 1756299600000, title: "Niemann Foods TI- FedEx Office Carmel", id: "01K3H5EBRQG978JV7RQH8Q3197" },
  { date: 1756234800000, title: "Alleato Group LinkedIn SMM Updates", id: "01K374MASR56PSSAB31A6P1BPC" },
  { date: 1756229400000, title: "Daily TB", id: "01K3EK2AER2E016Y8WZB9VSCR6" },
  { date: 1756218600000, title: "Alleato//FedEx #0704 Carmel IN BiWeekly", id: "01K374MAQDGWKKMG7S0B2MA34P" },
  { date: 1756150200000, title: "Weekly Company Operations Meeting", id: "01K374MARW30BQ87J8ZR3Z83JQ" },
  { date: 1756143000000, title: "Daily TB", id: "01K3C0N744HKBPR04NB40NE4PM" },
  { date: 1756137600000, title: "Microsoft Project", id: "01K3BZXJD0FT192KZQSD6MHRXJ" },
  { date: 1756135800000, title: "AI+ Envelopes", id: "01K3GTC0T4FBJ77F9J1KEYMK8Z" },
  { date: 1756132200000, title: "Goodwill Bloomington Morning Meeting", id: "01K374MASB967V17CDQJ6HN17G" },
  { date: 1756125000000, title: "AI+ Alleato Group", id: "01K3BH38RH56SCHBZQM2TFJPMF" },
  { date: 1755883800000, title: "Daily TB", id: "01K349EZHKKG5HDPV9907CNJM1" },
  { date: 1755873000000, title: "Goodwill Bloomington Morning Meeting", id: "01K347B91841CK2NHKV7MNT8YP" },
  { date: 1755807600000, title: "AI Audio Enhanced.mp3", id: "01K374MP99R7EXXTC4DB7S2FPT" },
  { date: 1755797400000, title: "Daily TB", id: "01K31Q2R4GRA42K373NRKD3C1W" },
  { date: 1755793800000, title: "Air Compressor Design Discussion", id: "01K34RJPPWC1SNEG8K2BS21WZV" },
  { date: 1755784800000, title: "Niemann+Alleato Weekly", id: "01K31Q2R8RTMYF7VY5M8Q28JF3" },
  { date: 1755725400000, title: "Uniqlo+Alleato Group", id: "01K2ZKPXYBPVHQHXKW5BH3JTQ8" },
  { date: 1755720000000, title: "GVI Paradise Isle Design Proposal Review", id: "01K31NDW1MV9G0YGBQBDZXFT71" },
  { date: 1755716400000, title: "Insurance Payments", id: "01K347TGJ3G8SB9013HTWNB8FS" },
  { date: 1755711000000, title: "Daily TB", id: "01K2Z4NY4ZAH3KQGARJPQY6KDB" },
  { date: 1755700200000, title: "Goodwill Bloomington Morning Meeting", id: "01K2Z2J2B3CXC97VKST971D4BA" },
  { date: 1755694800000, title: "Executive Weekly meeting", id: "01K2YN37N1YXNJJT5CCQQFMRK1" },
  { date: 1755626400000, title: "Weekly Accounting Meeting", id: "01K2WQA0P6PPAE47GE1CKANNBR" },
  { date: 1755624600000, title: "Daily TB", id: "01K2WJ99FXSGH1RR8Y7W1FE2RR" },
  { date: 1755545400000, title: "Weekly Company Operations Meeting", id: "01K2T7CAB67PZTQDXT8MD6RH45" },
  { date: 1755538200000, title: "Daily TB", id: "01K2SZW0RM24DGW3DYMMRXN3M9" },
  { date: 1755529200000, title: "Goodwill Bloomington Morning Meeting", id: "01K2SXR1SBY5R8Y839N5R9PYK3" },
  { date: 1755522000000, title: "Executive Weekly meeting", id: "01K2SGA0QWTX9RC62P1ZMB9KH7" },
  { date: 1755279000000, title: "RE: Air questions - Exotec", id: "01K2PZK05Q228XGMY9WCJENS36" }
];

async function compareMeetings() {
  try {
    // Fetch all meetings from the database
    const { data: dbMeetings, error } = await supabase
      .from('meetings')
      .select('fireflies_id, title, date')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching meetings:', error);
      return;
    }

    console.log(`\n📊 Database has ${dbMeetings?.length || 0} meetings total\n`);

    // Create a Set of existing fireflies_ids for quick lookup
    const existingIds = new Set(dbMeetings?.map(m => m.fireflies_id).filter(Boolean) || []);

    // Find missing meetings
    const missingMeetings = fireflyMeetings.filter(fm => !existingIds.has(fm.id));

    if (missingMeetings.length === 0) {
      console.log('✅ All 50 recent Fireflies meetings are already in the database!\n');
    } else {
      console.log(`❌ Found ${missingMeetings.length} meetings missing from the database:\n`);
      console.log('Missing meetings:');
      console.log('=================');
      
      missingMeetings.forEach((meeting, index) => {
        const date = new Date(meeting.date);
        console.log(`${index + 1}. ${date.toISOString().split('T')[0]} - ${meeting.title} - ${meeting.id}`);
      });

      console.log('\n📝 Summary:');
      console.log(`- Total Fireflies meetings checked: ${fireflyMeetings.length}`);
      console.log(`- Already in database: ${fireflyMeetings.length - missingMeetings.length}`);
      console.log(`- Missing from database: ${missingMeetings.length}`);
    }

    // Also check for meetings in DB that don't have fireflies_id
    const meetingsWithoutFirefliesId = dbMeetings?.filter(m => !m.fireflies_id) || [];
    if (meetingsWithoutFirefliesId.length > 0) {
      console.log(`\n⚠️  Found ${meetingsWithoutFirefliesId.length} meetings in database without Fireflies IDs`);
    }

  } catch (err) {
    console.error('Error:', err);
  }
}

compareMeetings();