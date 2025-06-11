import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testWorkingEndpoints() {
  console.log('Testing confirmed working API endpoints...\n');
  
  const tests = [
    { method: 'GET', url: '/api/gpt/clients', name: 'Clients API' },
    { method: 'GET', url: '/api/gpt/jobs', name: 'Jobs API' },
    { method: 'GET', url: '/api/gpt/dashboard', name: 'Dashboard API' }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.url}`, {
        method: test.method,
        headers: {
          'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const text = await response.text();
      
      console.log(`${test.name}: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const data = JSON.parse(text);
          console.log(`  ✅ SUCCESS - JSON Response`);
          console.log(`  Business: ${data.businessVerification?.businessName || 'Flatline Earthworks'}`);
          
          if (Array.isArray(data.data)) {
            console.log(`  Data count: ${data.data.length}`);
            if (data.data.length > 0) {
              const sample = data.data[0];
              console.log(`  Sample: ${sample.name || sample.title || sample.totalClients || 'N/A'}`);
            }
          } else if (data.data && typeof data.data === 'object') {
            console.log(`  Metrics: ${JSON.stringify(data.data)}`);
          }
          console.log(`  Message: ${data.message}`);
        } catch (e) {
          console.log(`  ❌ JSON Parse Error: ${e.message}`);
        }
      } else {
        console.log(`  ❌ FAILED`);
        console.log(`  Response: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`${test.name}: ERROR - ${error.message}`);
    }
    console.log('');
  }
}

testWorkingEndpoints();