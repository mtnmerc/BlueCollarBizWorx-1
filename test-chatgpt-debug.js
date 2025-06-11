import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testChatGPTHeaders() {
  console.log('Testing ChatGPT-style API requests...\n');
  
  // Test 1: X-API-Key header (what ChatGPT should send)
  console.log('1. Testing X-API-Key header:');
  try {
    const response1 = await fetch(`${BASE_URL}/api/gpt/debug`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'ChatGPT/1.0'
      }
    });
    
    const result1 = await response1.text();
    console.log('Status:', response1.status);
    console.log('Response:', result1.substring(0, 200));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Test 2: Try dashboard endpoint
  console.log('\n2. Testing dashboard endpoint with X-API-Key:');
  try {
    const response2 = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(result2, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  // Test 3: Check if server is running
  console.log('\n3. Testing server health:');
  try {
    const response3 = await fetch(`${BASE_URL}/health`, {
      method: 'GET'
    });
    
    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(result3, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testChatGPTHeaders();