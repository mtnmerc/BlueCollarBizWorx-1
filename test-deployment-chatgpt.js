import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testDeploymentChatGPT() {
  console.log('=== TESTING DEPLOYMENT CHATGPT ENDPOINTS ===\n');
  
  try {
    // Test GET /getClients with X-API-Key
    console.log('Testing GET /getClients...');
    const response = await fetch(`${BASE_URL}/getClients`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS: Retrieved clients');
      console.log('Clients count:', data.clients?.length || 0);
      console.log('Sample data:', JSON.stringify(data, null, 2).substring(0, 500));
    } else {
      const errorText = await response.text();
      console.log('❌ FAILED:', response.status);
      console.log('Error response:', errorText.substring(0, 300));
    }

    // Test POST /createClient
    console.log('\nTesting POST /createClient...');
    const createResponse = await fetch(`${BASE_URL}/createClient`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Client ChatGPT',
        email: 'test@chatgpt.com',
        phone: '555-0123',
        address: '123 Test St'
      })
    });

    console.log('Create response status:', createResponse.status);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('✅ CREATE SUCCESS');
      console.log('Created client:', createData.data);
    } else {
      const createError = await createResponse.text();
      console.log('❌ CREATE FAILED:', createResponse.status);
      console.log('Create error:', createError.substring(0, 300));
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDeploymentChatGPT();