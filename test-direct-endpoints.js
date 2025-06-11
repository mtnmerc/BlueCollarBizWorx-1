import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testDirectEndpoints() {
  console.log('Testing ChatGPT direct endpoint calls...\n');
  
  const tests = [
    { method: 'GET', url: '/getClients', name: 'getClients()' },
    { method: 'GET', url: '/getJobs', name: 'getJobs()' },
    { method: 'GET', url: '/getDashboard', name: 'getDashboard()' },
    { method: 'POST', url: '/getJobs', name: 'getJobs() POST', body: {} },
    { method: 'POST', url: '/getDashboard', name: 'getDashboard() POST', body: {} }
  ];
  
  for (const test of tests) {
    try {
      const options = {
        method: test.method,
        headers: {
          'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      if (test.body) {
        options.body = JSON.stringify(test.body);
      }
      
      const response = await fetch(`${BASE_URL}${test.url}`, options);
      const text = await response.text();
      
      console.log(`${test.name}: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const data = JSON.parse(text);
          console.log(`  ✅ SUCCESS`);
          console.log(`  Business: ${data.businessVerification?.businessName}`);
          
          if (Array.isArray(data.data)) {
            console.log(`  Data count: ${data.data.length}`);
            if (data.data.length > 0) {
              console.log(`  Sample: ${data.data[0].name || data.data[0].title || 'N/A'}`);
            }
          } else if (data.data && typeof data.data === 'object') {
            console.log(`  Metrics: ${JSON.stringify(data.data)}`);
          }
        } catch (e) {
          console.log(`  ⚠️  Response is HTML, not JSON`);
          console.log(`  Raw response: ${text.substring(0, 100)}...`);
        }
      } else {
        console.log(`  ❌ FAILED`);
        try {
          const errorData = JSON.parse(text);
          console.log(`  Error: ${errorData.error}`);
        } catch (e) {
          console.log(`  HTML/Text response - likely routing issue`);
        }
      }
    } catch (error) {
      console.log(`${test.name}: NETWORK ERROR - ${error.message}`);
    }
    console.log('');
  }
  
  console.log('=== SUMMARY ===');
  console.log('If all tests show SUCCESS, upload bizworx-chatgpt-complete-schema.json to ChatGPT');
  console.log('This matches the exact operationId patterns ChatGPT expects');
}

testDirectEndpoints();