import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testGetClientsEndpoint() {
  console.log('Testing /getClients endpoint that ChatGPT is calling...\n');
  
  // Test 1: GET method
  console.log('1. Testing GET /getClients:');
  try {
    const response = await fetch(`${BASE_URL}/getClients`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.clients) {
      console.log('✓ GET /getClients working');
      console.log('Clients found:', data.clients.length);
      const realClients = data.clients.filter(c => 
        c.name === 'John Deere' || c.name === 'Christine Vasickanin'
      );
      console.log('Real clients:', realClients.length);
    }
  } catch (error) {
    console.error('❌ GET test failed:', error.message);
  }
  
  // Test 2: POST method with empty body (what ChatGPT is doing)
  console.log('\n2. Testing POST /getClients with empty body:');
  try {
    const response = await fetch(`${BASE_URL}/getClients`, {
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
    
    const data = await response.json();
    console.log('Response keys:', Object.keys(data));
    
    if (data.success && data.clients) {
      console.log('✓ POST /getClients working');
      console.log('Message:', data.message);
      console.log('Clients count:', data.clients.length);
      
      // Show real clients
      const realClients = data.clients.filter(c => 
        c.name === 'John Deere' || c.name === 'Christine Vasickanin'
      );
      console.log('Real clients found:');
      realClients.forEach(client => {
        console.log(`- ${client.name}: ${client.email}`);
      });
    }
  } catch (error) {
    console.error('❌ POST test failed:', error.message);
  }
  
  // Test 3: Simulate ChatGPT headers exactly
  console.log('\n3. Testing with ChatGPT-like headers:');
  try {
    const response = await fetch(`${BASE_URL}/getClients`, {
      method: 'POST',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; OpenAI-GPT)',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      },
      body: JSON.stringify({})
    });
    
    console.log('Status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✓ ChatGPT simulation successful');
      console.log('Business:', data.message);
      console.log('Total clients:', data.clients?.length || 0);
    } else {
      const text = await response.text();
      console.log('❌ Error response:', text.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ ChatGPT simulation failed:', error.message);
  }
}

testGetClientsEndpoint();