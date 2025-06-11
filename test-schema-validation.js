import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testSchemaValidation() {
  console.log('Testing API endpoints to validate OpenAPI schema...\n');
  
  // Test 1: Check what endpoint ChatGPT is actually trying to call
  console.log('1. Testing all possible client endpoints:');
  
  const endpoints = [
    { path: '/api/gpt/clients', method: 'GET' },
    { path: '/getClients', method: 'GET' },
    { path: '/getClients', method: 'POST' },
    { path: '/clients', method: 'GET' },
    { path: '/api/clients', method: 'GET' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      if (endpoint.method === 'POST') {
        options.body = JSON.stringify({});
      }
      
      const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
      const text = await response.text();
      
      console.log(`${endpoint.method} ${endpoint.path}: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const data = JSON.parse(text);
          console.log(`  ✓ Success - Returns: ${Object.keys(data).join(', ')}`);
          if (data.data) {
            console.log(`  ✓ Client count: ${data.data.length}`);
          }
        } catch (e) {
          console.log(`  ❌ Invalid JSON response`);
        }
      } else if (response.status === 400) {
        console.log(`  ❌ 400 Bad Request - This is what ChatGPT is hitting`);
        if (text.includes('<html>')) {
          console.log(`  ❌ HTML error page returned`);
        } else {
          console.log(`  ✓ JSON error response`);
        }
      }
    } catch (error) {
      console.log(`${endpoint.method} ${endpoint.path}: ERROR - ${error.message}`);
    }
  }
  
  // Test 2: Check authentication requirements
  console.log('\n2. Testing authentication:');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
        // No API key
      }
    });
    
    console.log(`No API key: ${response.status}`);
    if (response.status === 401) {
      const data = await response.json();
      console.log(`  ✓ Proper 401 response: ${data.error}`);
    }
  } catch (error) {
    console.log(`Auth test failed: ${error.message}`);
  }
  
  // Test 3: Verify response structure matches schema
  console.log('\n3. Checking response structure:');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Response structure:');
    console.log(`  success: ${typeof data.success} (${data.success})`);
    console.log(`  data: ${Array.isArray(data.data) ? 'array' : typeof data.data} (${data.data?.length} items)`);
    console.log(`  message: ${typeof data.message} ("${data.message}")`);
    
    if (data.data && data.data[0]) {
      console.log('First client structure:');
      console.log(`  ${JSON.stringify(data.data[0], null, 2)}`);
    }
  } catch (error) {
    console.log(`Structure test failed: ${error.message}`);
  }
}

testSchemaValidation();