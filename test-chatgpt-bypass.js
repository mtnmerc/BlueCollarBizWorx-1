import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testChatGPTBypass() {
  console.log('Testing ChatGPT API access with proper JSON responses...\n');
  
  // Test 1: Get clients with proper headers
  console.log('1. Testing GET /api/gpt/clients:');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'ChatGPT/1.0'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    console.log('Response type:', typeof text);
    console.log('Response length:', text.length);
    
    if (response.status === 200) {
      const data = JSON.parse(text);
      console.log('✓ SUCCESS: JSON response received');
      console.log('Clients found:', data.data?.length || 0);
      console.log('Real clients:', data.data?.filter(c => 
        c.name === 'John Deere' || c.name === 'Christine Vasickanin'
      ).length || 0);
    } else {
      console.log('❌ Error response:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Test 1 failed:', error.message);
  }
  
  // Test 2: Test POST to wrong endpoint (should get JSON error)
  console.log('\n2. Testing POST /api/gpt/clients (should return JSON error):');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'POST',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const text = await response.text();
    if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
      console.log('❌ PROBLEM: HTML response instead of JSON');
      console.log('Response:', text.substring(0, 100));
    } else {
      console.log('✓ SUCCESS: JSON error response received');
      try {
        const data = JSON.parse(text);
        console.log('Error message:', data.error || data.message);
      } catch (e) {
        console.log('Response text:', text);
      }
    }
  } catch (error) {
    console.error('❌ Test 2 failed:', error.message);
  }
  
  // Test 3: Test nonexistent endpoint
  console.log('\n3. Testing GET /api/gpt/nonexistent (should return JSON 404):');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/nonexistent`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    
    if (text.includes('<html>') || text.includes('<!DOCTYPE')) {
      console.log('❌ PROBLEM: HTML 404 instead of JSON');
    } else {
      console.log('✓ SUCCESS: JSON 404 response');
      try {
        const data = JSON.parse(text);
        console.log('404 message:', data.error);
      } catch (e) {
        console.log('Response:', text);
      }
    }
  } catch (error) {
    console.error('❌ Test 3 failed:', error.message);
  }
}

testChatGPTBypass();