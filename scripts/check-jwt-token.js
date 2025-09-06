require('dotenv').config({ path: '.env.local' });

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

function decodeJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return null;
  }
  
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return payload;
  } catch (e) {
    return null;
  }
}

console.log('Checking JWT tokens...\n');

if (anonKey) {
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:');
  const anonPayload = decodeJWT(anonKey);
  if (anonPayload) {
    console.log('  Role:', anonPayload.role);
    console.log('  Ref:', anonPayload.ref);
    console.log('  Issued:', new Date(anonPayload.iat * 1000).toISOString());
    console.log('  Expires:', new Date(anonPayload.exp * 1000).toISOString());
    
    if (anonPayload.role !== 'anon') {
      console.log('  ⚠️  WARNING: This key has role "' + anonPayload.role + '" but should be "anon"!');
    }
  } else {
    console.log('  ❌ Invalid JWT format');
  }
}

console.log('\nSUPABASE_SERVICE_ROLE_KEY:');
if (serviceKey) {
  const servicePayload = decodeJWT(serviceKey);
  if (servicePayload) {
    console.log('  Role:', servicePayload.role);
    console.log('  Ref:', servicePayload.ref);
  } else {
    console.log('  ❌ Invalid JWT format');
  }
} else {
  console.log('  Not found');
}

// Check for the alternative anon key
const altAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY;
if (altAnonKey && altAnonKey !== anonKey) {
  console.log('\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY (alternative):');
  const altPayload = decodeJWT(altAnonKey);
  if (altPayload) {
    console.log('  Role:', altPayload.role);
    console.log('  Ref:', altPayload.ref);
  }
}