import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bizworx-7faf4.web.app';

async function testServerChanges() {
  try {
    console.log('Testing server changes...');
    
    // Test the new test endpoint
    const testResponse = await fetch(`${BASE_URL}/api/gpt/test`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    const testData = await testResponse.json();
    console.log('Test endpoint response:', JSON.stringify(testData, null, 2));
    
    // Test estimates endpoint
    const estimatesResponse = await fetch(`${BASE_URL}/api/gpt/estimates`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    const estimatesData = await estimatesResponse.json();
    console.log('Estimates endpoint first item keys:', Object.keys(estimatesData.data?.[0] || {}));
    
  } catch (error) {
    console.error('Error testing server:', error);
  }
}

testServerChanges();