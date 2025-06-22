import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bizworx-7faf4.web.app';

async function testBearerAuth() {
  console.log('Testing Bearer authentication format for ChatGPT...\n');
  
  const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  
  console.log('Status:', response.status);
  console.log('Success:', data.success);
  console.log('Message:', data.message);
  console.log('Clients found:', data.data?.length || 0);
  
  if (data.success && data.data?.length > 0) {
    console.log('\n✅ Bearer authentication working correctly!');
    console.log('First client:', data.data[0].name);
  } else {
    console.log('\n❌ Authentication failed');
  }
}

testBearerAuth();