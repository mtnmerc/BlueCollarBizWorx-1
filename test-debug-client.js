import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testDebugClient() {
  console.log('Testing debug client creation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Debug Client Test',
        email: 'debug@test.com',
        phone: '555-123-4567'
      })
    });

    console.log('Status:', response.status);
    const data = await response.text();
    
    try {
      const parsed = JSON.parse(data);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Raw response:', data.substring(0, 500));
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testDebugClient();