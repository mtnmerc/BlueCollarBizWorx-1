import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bizworx-7faf4.web.app';

async function testHeaderDebug() {
  console.log('Testing header extraction debugging...\n');

  // Create a simple test endpoint to see headers
  const response = await fetch(`${BASE_URL}/health`, {
    method: 'GET',
    headers: {
      'X-API-Key': API_KEY,
      'x-api-key': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log('Health endpoint response:', data);
  
  // Now test the actual clients endpoint with detailed headers
  console.log('\n--- Testing /api/gpt/clients with multiple header formats ---');
  
  const tests = [
    { name: 'X-API-Key (uppercase)', headers: { 'X-API-Key': API_KEY } },
    { name: 'x-api-key (lowercase)', headers: { 'x-api-key': API_KEY } },
    { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${API_KEY}` } }
  ];
  
  for (const test of tests) {
    console.log(`\nTesting ${test.name}:`);
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        ...test.headers,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    console.log(`Message: ${data.message}`);
    console.log(`Clients: ${data.data?.length || 0}`);
  }
}

testHeaderDebug();