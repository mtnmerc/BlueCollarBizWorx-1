import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bizworx-7faf4.web.app';

async function testClientEndpoint() {
  console.log('Testing ChatGPT client endpoint access...\n');
  
  try {
    // Test the exact endpoint ChatGPT uses
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Response headers:', JSON.stringify(Object.fromEntries(response.headers), null, 2));
    
    const responseText = await response.text();
    
    // Check if response is JSON
    try {
      const parsed = JSON.parse(responseText);
      console.log('Response data:', JSON.stringify(parsed, null, 2));
      
      if (parsed.success && parsed.data) {
        console.log(`\nClients found: ${parsed.data.length}`);
        parsed.data.forEach((client, index) => {
          console.log(`${index + 1}. ${client.name} (ID: ${client.id}) - ${client.email || 'No email'}`);
        });
      }
      
      return { status: response.status, data: parsed };
    } catch (parseError) {
      console.log('Failed to parse JSON response');
      console.log('Raw response (first 500 chars):', responseText.substring(0, 500));
      console.log('Parse error:', parseError.message);
      return { status: response.status, isHTML: responseText.includes('<!DOCTYPE html>'), raw: responseText };
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    return { error: error.message };
  }
}

// Also test without Authorization header to see error handling
async function testWithoutAuth() {
  console.log('\n=== Testing without Authorization header ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    const responseText = await response.text();
    
    try {
      const parsed = JSON.parse(responseText);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Non-JSON response:', responseText.substring(0, 200));
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

// Test with malformed API key
async function testWithBadKey() {
  console.log('\n=== Testing with invalid API key ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid_key_123',
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    const responseText = await response.text();
    
    try {
      const parsed = JSON.parse(responseText);
      console.log('Response:', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('Non-JSON response:', responseText.substring(0, 200));
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

async function runAllTests() {
  await testClientEndpoint();
  await testWithoutAuth();
  await testWithBadKey();
  
  console.log('\n=== Analysis Complete ===');
  console.log('Check for:');
  console.log('1. Is the endpoint returning the correct status code?');
  console.log('2. Is the response properly formatted JSON?');
  console.log('3. Are clients being returned for valid API keys?');
  console.log('4. Are error cases handled correctly?');
}

runAllTests();