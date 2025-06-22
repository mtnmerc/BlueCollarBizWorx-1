import fetch from 'node-fetch';

const BASE_URL = 'https://bizworx-7faf4.web.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testAuth() {
  console.log('Testing API authentication...\n');
  
  try {
    // Test with X-API-Key header
    const response = await fetch(`${BASE_URL}/api/gpt/jobs`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Headers sent:', { 'X-API-Key': API_KEY });
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (response.status === 403) {
      console.log('\n403 Error detected. Checking authentication...');
      
      // Test without API key to see default response
      const noKeyResponse = await fetch(`${BASE_URL}/api/gpt/jobs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const noKeyResult = await noKeyResponse.json();
      console.log('\nResponse without API key:');
      console.log(`Status: ${noKeyResponse.status}`);
      console.log('Response:', JSON.stringify(noKeyResult, null, 2));
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testAuth();