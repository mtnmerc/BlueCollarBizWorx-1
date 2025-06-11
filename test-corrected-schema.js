import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testCorrectedSchemaRoutes() {
  console.log('Testing corrected schema routes that ChatGPT will call...\n');
  
  // These are the exact paths ChatGPT will construct from the corrected schema:
  // Base URL: https://bluecollarbizworx.replit.app/api/gpt
  // Path: /clients -> Full URL: https://bluecollarbizworx.replit.app/api/gpt/clients
  
  const tests = [
    { 
      url: '/api/gpt/clients', 
      operation: 'getClientsList()',
      description: 'ChatGPT calls: https://bluecollarbizworx.replit.app/api/gpt + /clients'
    },
    { 
      url: '/api/gpt/jobs', 
      operation: 'getJobsList()',
      description: 'ChatGPT calls: https://bluecollarbizworx.replit.app/api/gpt + /jobs'
    },
    { 
      url: '/api/gpt/dashboard', 
      operation: 'getDashboardMetrics()',
      description: 'ChatGPT calls: https://bluecollarbizworx.replit.app/api/gpt + /dashboard'
    }
  ];
  
  for (const test of tests) {
    console.log(`Testing ${test.operation}`);
    console.log(`Route: ${test.description}`);
    
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: 'GET',
        headers: {
          'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const text = await response.text();
      
      if (response.status === 200) {
        try {
          const data = JSON.parse(text);
          console.log(`✅ SUCCESS: ${response.status}`);
          console.log(`Business: ${data.businessVerification?.businessName}`);
          
          if (Array.isArray(data.data)) {
            console.log(`Data count: ${data.data.length}`);
          } else if (data.data && typeof data.data === 'object') {
            console.log(`Metrics: ${JSON.stringify(data.data)}`);
          }
        } catch (e) {
          console.log(`❌ JSON parse error`);
        }
      } else {
        console.log(`❌ FAILED: ${response.status}`);
        console.log(`Response: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`❌ NETWORK ERROR: ${error.message}`);
    }
    console.log('');
  }
  
  console.log('=== CORRECTED SCHEMA SUMMARY ===');
  console.log('The corrected schema uses:');
  console.log('- Base URL: https://bluecollarbizworx.replit.app/api/gpt');
  console.log('- Relative paths: /clients, /jobs, /dashboard');
  console.log('- Unique operationIds: getClientsList, getJobsList, getDashboardMetrics');
  console.log('- This ensures ChatGPT calls the correct working endpoints');
}

testCorrectedSchemaRoutes();