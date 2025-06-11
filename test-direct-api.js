import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testDirectAPI() {
  console.log('Testing direct API access...\n');
  
  // Test 1: Dashboard without any headers
  console.log('1. Testing dashboard (no headers):');
  try {
    const response1 = await fetch(`${BASE_URL}/api/gpt/dashboard`);
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Response:', JSON.stringify(result1, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n2. Testing clients (no headers):');
  try {
    const response2 = await fetch(`${BASE_URL}/api/gpt/clients`);
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Response:', JSON.stringify(result2, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n3. Testing jobs (no headers):');
  try {
    const response3 = await fetch(`${BASE_URL}/api/gpt/jobs`);
    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Response:', JSON.stringify(result3, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n4. Testing with correct API key:');
  try {
    const response4 = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f'
      }
    });
    const result4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Response:', JSON.stringify(result4, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDirectAPI();