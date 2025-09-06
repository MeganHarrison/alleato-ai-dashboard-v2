import { chromium } from '@playwright/test'

async function triggerVectorization() {
  console.log('🤖 Starting automated vectorization trigger...\n')
  
  const browser = await chromium.launch({ 
    headless: false, // Show browser for debugging
    timeout: 60000 
  })
  
  const context = await browser.newContext()
  const page = await context.newPage()
  
  try {
    // 1. Navigate to the API endpoint
    console.log('📍 Navigating to vectorization endpoint...')
    await page.goto('http://localhost:3010/api/cron/vectorize-meetings', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    })
    
    // Check if we got redirected to login
    const currentUrl = page.url()
    console.log(`📍 Current URL: ${currentUrl}`)
    
    if (currentUrl.includes('/auth/login') || currentUrl.includes('/auth/signin')) {
      console.log('🔐 Redirected to login page - authentication required')
      console.log('\n⚠️  Manual steps required:')
      console.log('1. Login at http://localhost:3010')
      console.log('2. Visit http://localhost:3010/api/cron/vectorize-meetings')
      console.log('3. Or use the Meeting Intelligence page Upload tab')
    } else {
      // We got a response from the API
      const content = await page.textContent('body')
      console.log('✅ API Response received!')
      
      try {
        const json = JSON.parse(content)
        console.log('📊 Vectorization Status:', json)
        
        if (json.success) {
          console.log('✨ Vectorization successfully triggered!')
          console.log(`   Message: ${json.message}`)
        }
      } catch {
        console.log('📄 Response (first 500 chars):', content.substring(0, 500))
      }
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'vectorization-result.png' })
    console.log('📸 Screenshot saved as vectorization-result.png')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await browser.close()
    console.log('\n✅ Browser closed')
  }
}

// Run the automation
triggerVectorization().catch(console.error)