import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function debugHeaders() {
  console.log('Debugging header handling...\n');

  // Test 1: X-API-Key with lowercase
  console.log('1. Testing with x-api-key (lowercase):');
  const response1 = await fetch(`${BASE_URL}/api/gpt/clients`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  const data1 = await response1.json();
  console.log(`Status: ${response1.status}, Success: ${data1.success}, Message: ${data1.message}\n`);

  // Test 2: X-API-Key with uppercase
  console.log('2. Testing with X-API-Key (uppercase):');
  const response2 = await fetch(`${BASE_URL}/api/gpt/clients`, {
    method: 'GET',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    }
  });
  const data2 = await response2.json();
  console.log(`Status: ${response2.status}, Success: ${data2.success}, Message: ${data2.message}\n`);

  // Test 3: Authorization Bearer (working format)
  console.log('3. Testing with Authorization Bearer:');
  const response3 = await fetch(`${BASE_URL}/api/gpt/clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  const data3 = await response3.json();
  console.log(`Status: ${response3.status}, Success: ${data3.success}, Message: ${data3.message}\n`);

  console.log('Summary:');
  console.log(`- x-api-key: ${data1.success ? 'WORKING' : 'FAILED'}`);
  console.log(`- X-API-Key: ${data2.success ? 'WORKING' : 'FAILED'}`);
  console.log(`- Authorization Bearer: ${data3.success ? 'WORKING' : 'FAILED'}`);
}

debugHeaders();