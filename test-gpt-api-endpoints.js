import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testGPTEndpoints() {
  console.log('=== Testing Updated GPT Endpoints ===\n');

  const endpoints = [
    '/api/gpt/dashboard/stats',
    '/api/gpt/clients',
    '/api/gpt/jobs'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.text();
      let parsedData;
      
      try {
        parsedData = JSON.parse(data);
        console.log(`Status: ${response.status}`);
        console.log(`Response:`, JSON.stringify(parsedData, null, 2));
        
        if (parsedData.success) {
          console.log('✅ Endpoint working correctly\n');
        } else {
          console.log('❌ Endpoint returned error\n');
        }
      } catch (parseError) {
        console.log(`Status: ${response.status}`);
        console.log('❌ Invalid JSON response - likely HTML from Vite middleware');
        console.log(`First 200 chars: ${data.substring(0, 200)}...\n`);
      }
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}\n`);
    }
  }
}

testGPTEndpoints();