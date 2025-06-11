import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testChatGPTExactFormat() {
  console.log('Testing exact ChatGPT request format...\n');
  
  // Test what happens when no auth is provided (like ChatGPT might be doing)
  console.log('1. Testing request WITHOUT authentication (simulating ChatGPT error):');
  try {
    const response1 = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ChatGPT)'
      }
    });
    
    const result1 = await response1.text();
    console.log('Status:', response1.status);
    console.log('Response:', result1);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n2. Testing no-auth endpoint (should work):');
  try {
    const response2 = await fetch(`${BASE_URL}/api/gpt/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ChatGPT)'
      }
    });
    
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(result2, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n3. Testing with correct X-API-Key (should work):');
  try {
    const response3 = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ChatGPT)'
      }
    });
    
    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(result3, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testChatGPTExactFormat();