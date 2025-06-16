// Test GPT endpoints against the unified schema
async function testGPTEndpoints() {
  console.log('=== TESTING GPT ENDPOINTS AGAINST UNIFIED SCHEMA ===\n');
  
  const baseUrl = 'https://bluecollarbizworx.replit.app';
  
  // Test endpoints without API key first
  const endpoints = [
    '/api/gpt/clients',
    '/api/gpt/jobs',
    '/api/gpt/estimates',
    '/api/gpt/invoices'
  ];
  
  console.log('1. Testing endpoint accessibility...');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      console.log(`${endpoint}: ${response.status} (expected 401 without auth)`);
      
      if (response.status === 401) {
        const errorData = await response.json();
        console.log(`  Error format: ${JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n2. Testing response format compliance...');
  
  // Test with a test API key to see response structure
  const testKey = 'bw_test_key_12345';
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: { 'X-API-Key': testKey }
      });
      
      console.log(`${endpoint}: ${response.status}`);
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        console.log(`  Response structure: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
        
        // Check if response matches expected format
        if (data.hasOwnProperty('success') && data.hasOwnProperty('data')) {
          console.log(`  ✅ Matches unified schema format`);
        } else {
          console.log(`  ❌ Does not match unified schema format`);
        }
      }
    } catch (error) {
      console.log(`${endpoint}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n=== ENDPOINT TESTING COMPLETE ===');
}

testGPTEndpoints();