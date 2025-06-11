import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testChatGPTEndpoint() {
  console.log('Testing ChatGPT endpoint with detailed debugging...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'User-Agent': 'ChatGPT-User/1.0',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('Parsed JSON:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    }
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testChatGPTEndpoint();