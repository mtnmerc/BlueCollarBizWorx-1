import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testChatGPTConnectivity() {
  console.log('Testing API connectivity that ChatGPT is trying to access...\n');
  
  // Test 1: Basic connectivity
  console.log('1. Testing base URL connectivity:');
  try {
    const response = await fetch(BASE_URL);
    console.log(`Base URL: ${response.status} ${response.statusText}`);
  } catch (error) {
    console.log(`Base URL failed: ${error.message}`);
  }
  
  // Test 2: API endpoint health
  console.log('\n2. Testing API endpoints ChatGPT should access:');
  
  const endpoints = [
    '/api/gpt/clients',
    '/api/gpt/jobs', 
    '/api/gpt/dashboard',
    '/api/gpt/test'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
          'User-Agent': 'ChatGPT/OpenAI',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        console.log(`  ❌ Endpoint not found - this is what ChatGPT is hitting`);
      } else if (response.status === 200) {
        console.log(`  ✓ Working correctly`);
      }
      
    } catch (error) {
      console.log(`${endpoint}: Connection failed - ${error.message}`);
    }
  }
  
  // Test 3: Check if server is properly routing API calls
  console.log('\n3. Testing server routing:');
  
  try {
    const response = await fetch(`${BASE_URL}/api/nonexistent`, {
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f'
      }
    });
    
    const text = await response.text();
    console.log(`Non-existent API endpoint: ${response.status}`);
    
    if (text.includes('API endpoint not found')) {
      console.log('  ✓ API routing working - returns JSON error');
    } else if (text.includes('<html>')) {
      console.log('  ❌ API routing broken - returns HTML instead of JSON');
    }
    
  } catch (error) {
    console.log(`Routing test failed: ${error.message}`);
  }
  
  // Test 4: Simulate exact ChatGPT request
  console.log('\n4. Simulating ChatGPT request:');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'User-Agent': 'Mozilla/5.0 (compatible; OpenAI)',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });
    
    console.log(`ChatGPT simulation: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log(`  ✓ Success - Found ${data.data?.length || 0} clients`);
      
      // Verify authentic data
      const realClients = data.data?.filter(c => 
        c.name === 'John Deere' || c.name === 'Christine Vasickanin'
      );
      console.log(`  ✓ Authentic clients: ${realClients?.length || 0}`);
      
    } else {
      const text = await response.text();
      console.log(`  ❌ Error: ${text.substring(0, 100)}`);
    }
    
  } catch (error) {
    console.log(`ChatGPT simulation failed: ${error.message}`);
  }
}

testChatGPTConnectivity();