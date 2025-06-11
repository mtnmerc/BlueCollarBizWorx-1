import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testBearerAuthentication() {
  console.log('Testing Bearer token authentication for ChatGPT...\n');
  
  const endpoints = [
    { path: '/api/gpt/clients', name: 'getClients()' },
    { path: '/api/gpt/jobs', name: 'getJobs()' },
    { path: '/api/gpt/dashboard', name: 'getDashboard()' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const text = await response.text();
      
      console.log(`${endpoint.name}: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const data = JSON.parse(text);
          console.log(`  SUCCESS - Business: ${data.businessVerification?.businessName || 'Flatline Earthworks'}`);
          
          if (Array.isArray(data.data)) {
            console.log(`  Data count: ${data.data.length}`);
          } else if (data.data && typeof data.data === 'object') {
            console.log(`  Metrics: ${JSON.stringify(data.data)}`);
          }
          console.log(`  Message: ${data.message}`);
        } catch (e) {
          console.log(`  JSON parse error`);
        }
      } else {
        console.log(`  FAILED: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`${endpoint.name}: Network error - ${error.message}`);
    }
    console.log('');
  }
}

testBearerAuthentication();