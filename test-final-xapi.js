import fetch from 'node-fetch';

const BASE_URL = 'https://bizworx-7faf4.web.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testXApiKeyAuthentication() {
  console.log('Testing X-API-Key authentication with ChatGPT Custom GPT format...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'ChatGPT Custom GPT'
      }
    });
    
    const status = response.status;
    const data = await response.json();
    
    console.log(`Status: ${status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (status === 200 && data.success) {
      console.log('✅ X-API-Key authentication SUCCESSFUL');
      return true;
    } else if (status === 401) {
      console.log('❌ X-API-Key authentication FAILED - 401 Unauthorized');
      return false;
    } else {
      console.log('❌ X-API-Key authentication FAILED - Unexpected response');
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function testBearerAuthentication() {
  console.log('\nTesting Bearer token authentication...\n');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const status = response.status;
    const data = await response.json();
    
    console.log(`Status: ${status}`);
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (status === 200 && data.success) {
      console.log('✅ Bearer authentication SUCCESSFUL');
      return true;
    } else {
      console.log('❌ Bearer authentication FAILED');
      return false;
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('=== COMPREHENSIVE AUTHENTICATION TEST ===\n');
  
  const xApiResult = await testXApiKeyAuthentication();
  const bearerResult = await testBearerAuthentication();
  
  console.log('\n=== RESULTS ===');
  console.log(`X-API-Key: ${xApiResult ? 'PASS' : 'FAIL'}`);
  console.log(`Bearer Token: ${bearerResult ? 'PASS' : 'FAIL'}`);
  
  if (xApiResult && bearerResult) {
    console.log('\n🎉 All authentication methods working correctly!');
  } else {
    console.log('\n⚠️  Some authentication methods failed');
  }
}

runComprehensiveTest();