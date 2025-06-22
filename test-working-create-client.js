import fetch from 'node-fetch';

const BASE_URL = 'https://bizworx-7faf4.web.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testWorkingClientCreation() {
  console.log('Testing working client creation endpoint...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'ChatGPT Fix Test Client',
        email: 'chatgpt-fix@example.com',
        phone: '555-CHATGPT-FIX',
        address: '123 Test Street'
      })
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 200 && result.success) {
      console.log('\n✅ Client creation is working perfectly!');
      console.log(`New client ID: ${result.data.id}`);
      
      // Verify by getting all clients
      const listResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      const listResult = await listResponse.json();
      console.log(`\n📋 Total clients now: ${listResult.data.length}`);
      
      const newClient = listResult.data.find(c => c.id === result.data.id);
      if (newClient) {
        console.log('✅ New client appears in the list!');
      }
    } else {
      console.log('❌ Client creation failed');
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testWorkingClientCreation();