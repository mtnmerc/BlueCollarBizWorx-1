import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testXApiKeyAuth() {
  console.log('Testing X-API-Key authentication format...\n');

  // Test X-API-Key header with ChatGPT endpoints
  const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
    method: 'GET',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json',
      'User-Agent': 'ChatGPT-Actions/1.0'
    }
  });
  
  const data = await response.json();
  
  console.log('Status:', response.status);
  console.log('Success:', data.success);
  console.log('Message:', data.message);
  console.log('Clients found:', data.data?.length || 0);
  
  if (data.success && data.data?.length > 0) {
    console.log('\n✅ X-API-Key authentication working!');
    console.log('✅ ChatGPT Custom GPT should now work with updated schema');
    console.log('\nFirst few clients:');
    data.data.slice(0, 3).forEach(client => {
      console.log(`- ${client.name} (ID: ${client.id})`);
    });
  } else {
    console.log('\n❌ X-API-Key authentication failed');
    console.log('Response:', data);
  }
}

testXApiKeyAuth();