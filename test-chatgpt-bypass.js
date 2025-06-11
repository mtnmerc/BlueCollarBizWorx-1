import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testChatGPTBypass() {
  console.log('Testing ChatGPT bypass endpoints...\n');
  
  // Test with ChatGPT user agent to trigger bypass
  const chatGPTHeaders = {
    'User-Agent': 'ChatGPT/1.0',
    'Content-Type': 'application/json'
  };
  
  console.log('1. Testing dashboard with ChatGPT bypass:');
  try {
    const response1 = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      method: 'GET',
      headers: chatGPTHeaders
    });
    
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(result1, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n2. Testing clients with ChatGPT bypass:');
  try {
    const response2 = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: chatGPTHeaders
    });
    
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n3. Testing jobs with ChatGPT bypass:');
  try {
    const response3 = await fetch(`${BASE_URL}/api/gpt/jobs`, {
      method: 'GET',
      headers: chatGPTHeaders
    });
    
    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(result3, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testChatGPTBypass();