import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testChatGPTExactFormat() {
  console.log('Testing with ChatGPT exact format...\n');
  
  // Test 1: Exact ChatGPT headers format
  console.log('1. Testing with ChatGPT User-Agent and headers:');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 ChatGPT/1.0',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response length:', text.length);
    if (response.status === 400) {
      console.log('400 Error response:', text);
    } else {
      console.log('Success - clients returned');
    }
  } catch (error) {
    console.error('Test 1 error:', error.message);
  }
  
  // Test 2: Try POST method (what ChatGPT might be doing incorrectly)
  console.log('\n2. Testing POST method (potential ChatGPT mistake):');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'POST',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json',
        'User-Agent': 'ChatGPT/1.0'
      },
      body: JSON.stringify({})
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text);
  } catch (error) {
    console.error('Test 2 error:', error.message);
  }
  
  // Test 3: Different content-type
  console.log('\n3. Testing with different content-type:');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'text/plain',
        'User-Agent': 'ChatGPT/1.0'
      }
    });
    
    console.log('Status:', response.status);
    const text = await response.text();
    if (text.length < 200) {
      console.log('Response:', text);
    } else {
      console.log('Large response received, clients likely returned');
    }
  } catch (error) {
    console.error('Test 3 error:', error.message);
  }
}

testChatGPTExactFormat();