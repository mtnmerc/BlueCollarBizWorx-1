import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testServerStatus() {
  console.log('Testing server status and endpoints...\n');
  
  // Test 1: Basic health check
  try {
    console.log('1. Testing basic server response...');
    const healthResponse = await fetch(`${BASE_URL}/`);
    console.log('Server status:', healthResponse.status);
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    }
  } catch (error) {
    console.log('❌ Server connection failed:', error.message);
    return;
  }

  // Test 2: GET clients endpoint
  try {
    console.log('\n2. Testing GET /getClients...');
    const getResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    console.log('GET status:', getResponse.status);
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ GET clients working, found', data.clients?.length, 'clients');
    } else {
      const errorText = await getResponse.text();
      console.log('❌ GET failed:', errorText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ GET test failed:', error.message);
  }

  // Test 3: POST client creation (detailed error handling)
  try {
    console.log('\n3. Testing POST /api/gpt/clients...');
    const postResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Server Test Client',
        email: 'servertest@example.com',
        phone: '555-SERVER',
        address: '123 Server Test St'
      })
    });

    console.log('POST status:', postResponse.status);
    console.log('POST headers:', Object.fromEntries(postResponse.headers));
    
    if (postResponse.ok) {
      const data = await postResponse.json();
      console.log('✅ POST success:', data);
    } else {
      const errorText = await postResponse.text();
      console.log('❌ POST failed:', errorText);
      
      // Try to get more details if it's a server error
      if (postResponse.status === 500) {
        console.log('This appears to be a server-side error. Checking logs...');
      }
    }
  } catch (error) {
    console.log('❌ POST test failed:', error.message);
  }

  // Test 4: Check API authentication
  try {
    console.log('\n4. Testing authentication...');
    const authResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: { 'Authorization': 'Bearer invalid-test-key' }
    });
    
    if (authResponse.status === 401) {
      console.log('✅ Authentication properly rejects invalid keys');
    } else {
      console.log('❌ Authentication issue - status:', authResponse.status);
    }
  } catch (error) {
    console.log('❌ Auth test failed:', error.message);
  }
}

testServerStatus();