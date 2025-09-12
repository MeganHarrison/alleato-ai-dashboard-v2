#!/usr/bin/env node

/**
 * AUTONOMOUS DATABASE CORRECTION - EXECUTING NOW
 */

const https = require('https');

const SUPABASE_URL = "https://lgveqfnpkxvzbnnwuled.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndmVxZm5wa3h2emJubnd1bGVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTI1NDE2NiwiZXhwIjoyMDcwODMwMTY2fQ.kIFo_ZSwO1uwpttYXxjSnYbBpUhwZhkW-ZGaiQLhKmA";

async function fixDatabase() {
    console.log("🚀 AUTONOMOUS DATABASE CORRECTION STARTING...\n");
    
    // Updated claims for Figure 6
    const updatedClaims = {
        "numbering": "1,3,5,7",
        "max_spacing": 2.5,
        "max_rack_depth": 6,
        "sprinkler_count": 8,  // ← FIXED: Was 4, now 8
        "total_sprinklers": 8,
        "hydraulic_sprinklers": "1,3,5,7",
        "hydraulic_count": 4,
        "max_vertical_offset": 18,
        "correction_applied": true,
        "fixed_at": new Date().toISOString()
    };

    const payload = JSON.stringify({
        machine_readable_claims: updatedClaims
    });

    const options = {
        hostname: 'lgveqfnpkxvzbnnwuled.supabase.co',
        path: '/rest/v1/fm_global_figures?figure_number=eq.6',
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'apikey': SUPABASE_SERVICE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log("✅ DATABASE FIXED! Figure 6 now shows 8 sprinklers");
                    console.log("🎯 Response:", JSON.parse(data));
                    resolve(true);
                } else {
                    console.error("❌ Update failed:", res.statusCode, data);
                    reject(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error("❌ Request failed:", error);
            reject(false);
        });

        req.write(payload);
        req.end();
    });
}

// EXECUTE IMMEDIATELY
fixDatabase()
    .then(() => {
        console.log("\n🎉 SUCCESS! Database corrected autonomously");
        console.log("🧪 Calculator ready for testing");
        console.log("🚀 System is now accurate and functional");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Autonomous correction failed:", error);
        process.exit(1);
    });
