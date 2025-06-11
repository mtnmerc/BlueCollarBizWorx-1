import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testPostEndpoints() {
  console.log('Testing POST endpoints for ChatGPT compatibility...\n');
  
  const endpoints = [
    { url: '/api/gpt/dashboard', name: 'Dashboard POST' },
    { url: '/api/gpt/jobs', name: 'Jobs POST' },
    { url: '/api/gpt/clients', name: 'Clients POST' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.url}`, {
        method: 'POST',
        headers: {
          'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const text = await response.text();
      
      console.log(`${endpoint.name}: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const data = JSON.parse(text);
          console.log(`  ✅ SUCCESS - ${data.message || 'Data retrieved'}`);
          if (data.data) {
            const count = Array.isArray(data.data) ? data.data.length : 'object';
            console.log(`  📊 Data: ${count} items`);
          }
        } catch (e) {
          console.log(`  ⚠️  Response not JSON: ${text.substring(0, 50)}...`);
        }
      } else {
        console.log(`  ❌ FAILED`);
        try {
          const errorData = JSON.parse(text);
          console.log(`  Error: ${errorData.error || errorData.message}`);
        } catch (e) {
          console.log(`  Raw error: ${text.substring(0, 100)}`);
        }
      }
    } catch (error) {
      console.log(`${endpoint.name}: ERROR - ${error.message}`);
    }
    console.log('');
  }
}

testPostEndpoints();