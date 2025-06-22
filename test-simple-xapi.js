import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bizworx-7faf4.web.app';

async function testSimpleXApi() {
  console.log('Testing simple X-API-Key authentication...\n');

  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (data.success && data.data && data.data.length > 0) {
      console.log('✅ X-API-Key authentication working!');
    } else {
      console.log('❌ X-API-Key authentication failed');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSimpleXApi();