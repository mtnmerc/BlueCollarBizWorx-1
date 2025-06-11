import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function debugChatGPTRequests() {
  console.log('Debugging ChatGPT request failures...\n');
  
  // Test exact ChatGPT request format
  const chatGPTHeaders = {
    'User-Agent': 'ChatGPT-User/1.0',
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  console.log('1. Testing ChatGPT dashboard request (no API key):');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      method: 'GET',
      headers: chatGPTHeaders
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch {
      console.log('Response is not valid JSON');
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  console.log('\n2. Testing ChatGPT clients request (no API key):');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: chatGPTHeaders
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:', JSON.stringify(json, null, 2));
    } catch {
      console.log('Response is not valid JSON');
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  console.log('\n3. Testing with API key in header:');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        ...chatGPTHeaders,
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Raw response length:', text.length);
    
    try {
      const json = JSON.parse(text);
      console.log('Success! Data received:', json.data?.length || 0, 'items');
    } catch {
      console.log('Response is not valid JSON');
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
  
  console.log('\n4. Testing server health:');
  try {
    const response = await fetch(`${BASE_URL}/health`, {
      method: 'GET',
      headers: chatGPTHeaders
    });
    
    console.log('Health Status:', response.status);
    const json = await response.json();
    console.log('Health Response:', json);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
}

debugChatGPTRequests();