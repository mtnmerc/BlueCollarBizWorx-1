// Test GPT endpoints with real API key
async function testRealGPTEndpoints() {
  console.log('=== TESTING GPT ENDPOINTS WITH REAL API KEY ===\n');
  
  const baseUrl = 'https://bluecollarbizworx.replit.app';
  const apiKey = 'bw_lcf7itxs8qocat5sd5'; // Fixed Login Business
  
  const endpoints = [
    '/api/gpt/clients',
    '/api/gpt/jobs',
    '/api/gpt/estimates', 
    '/api/gpt/invoices'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\nTesting ${endpoint}:`);
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: { 'X-API-Key': apiKey }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();
        
        // Check unified schema compliance
        if (data.hasOwnProperty('success') && data.hasOwnProperty('data')) {
          console.log('✅ Matches unified schema format');
          console.log(`Success: ${data.success}`);
          
          if (Array.isArray(data.data)) {
            console.log(`Data array length: ${data.data.length}`);
            if (data.data.length > 0) {
              console.log('Sample item keys:', Object.keys(data.data[0]));
            }
          } else {
            console.log('Data type:', typeof data.data);
          }
        } else {
          console.log('❌ Does not match unified schema');
          console.log('Response keys:', Object.keys(data));
          console.log('Response preview:', JSON.stringify(data).substring(0, 200));
        }
      } else {
        console.log('❌ Not JSON response');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n=== REAL ENDPOINT TESTING COMPLETE ===');
}

testRealGPTEndpoints();