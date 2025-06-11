import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testDirectClientCreation() {
  console.log('Testing direct client creation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Direct Test Client',
        email: 'direct@test.com',
        phone: '555-DIRECT',
        address: '123 Direct Test Ave'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testDirectClientCreation();