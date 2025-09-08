#!/usr/bin/env node

/**
 * Verify Cloudflare D1 Configuration
 */

const CONFIG = {
  CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || 'd1416265449d2a0bae41c45c791270ec',
  CLOUDFLARE_D1_API_TOKEN: process.env.CLOUDFLARE_D1_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || 'GqmS3WJHA69Prddovzvrjmpf_IZ1kfkFrS9SrNIz',
  DATABASE_ID: 'fc7c9a6d-ca65-4768-b3f9-07ec5afb38c5'
}

console.log('🔍 Cloudflare D1 Configuration Check\n')
console.log('Current Configuration:')
console.log('─────────────────────')
console.log(`Account ID:  ${CONFIG.CLOUDFLARE_ACCOUNT_ID}`)
console.log(`API Token:   ${CONFIG.CLOUDFLARE_D1_API_TOKEN.substring(0, 10)}...`)
console.log(`Database ID: ${CONFIG.DATABASE_ID}`)
console.log('')

console.log('⚠️  Important Notes:')
console.log('─────────────────')
console.log('1. The Account ID looks like it might be an API key (d1416265449d2a0bae41c45c791270ec)')
console.log('   - Your actual Account ID should be different from your API key')
console.log('   - Find it at: https://dash.cloudflare.com/ → Right sidebar → Account ID')
console.log('')
console.log('2. To get your correct Account ID:')
console.log('   a. Log in to Cloudflare Dashboard')
console.log('   b. Select your account')
console.log('   c. Look for "Account ID" in the right sidebar')
console.log('   d. It should be a 32-character hexadecimal string')
console.log('')
console.log('3. To verify your API token has D1 permissions:')
console.log('   a. Go to: https://dash.cloudflare.com/profile/api-tokens')
console.log('   b. Find your token or create a new one')
console.log('   c. Ensure it has "D1:Edit" permissions')
console.log('')
console.log('4. Current error "Forbidden" suggests:')
console.log('   - The API token might not have D1 permissions')
console.log('   - Or the Account ID might be incorrect')
console.log('')
console.log('📝 Next Steps:')
console.log('──────────────')
console.log('1. Update CLOUDFLARE_ACCOUNT_ID in .env.local with your actual account ID')
console.log('2. Verify your API token has D1:Edit permissions')
console.log('3. Restart the development server after updating .env.local')
console.log('4. Test again by visiting: http://localhost:3007/meetings-d1')