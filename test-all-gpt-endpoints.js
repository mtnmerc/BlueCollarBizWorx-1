import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testEndpoint(endpoint, method = 'GET', data = null) {
  console.log(`\n=== Testing ${method} ${endpoint} ===`);
  
  try {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    console.log(`Status: ${response.status}`);
    
    const responseText = await response.text();
    
    // Check if response is JSON
    try {
      const parsed = JSON.parse(responseText);
      console.log('Response:', JSON.stringify(parsed, null, 2));
      return { status: response.status, data: parsed };
    } catch {
      console.log('Non-JSON response (first 200 chars):', responseText.substring(0, 200));
      return { status: response.status, isHTML: responseText.includes('<!DOCTYPE html>') };
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    return { error: error.message };
  }
}

async function runAllTests() {
  console.log('Testing all ChatGPT endpoints for authentication issues...\n');
  
  // Test GET endpoints that should work
  await testEndpoint('/api/gpt/dashboard/stats');
  await testEndpoint('/api/gpt/clients');
  await testEndpoint('/api/gpt/jobs');
  
  // Test POST endpoints - these are the critical ones that need businessId
  await testEndpoint('/api/gpt/clients', 'POST', {
    name: 'Test Client Auth Check',
    email: 'test-auth@example.com',
    phone: '555-000-0000'
  });
  
  // Test other POST endpoints that might have the same issue
  await testEndpoint('/gpt/jobs', 'POST', {
    clientId: 1,
    title: 'Test Job Auth Check',
    description: 'Testing authentication',
    scheduledStart: '2025-06-11T10:00:00Z'
  });
  
  await testEndpoint('/gpt/invoices', 'POST', {
    clientId: 1,
    title: 'Test Invoice Auth Check',
    total: '100.00'
  });
  
  await testEndpoint('/gpt/estimates', 'POST', {
    clientId: 1,
    title: 'Test Estimate Auth Check',
    total: '150.00'
  });
  
  await testEndpoint('/gpt/revenue');
  
  console.log('\n=== Test Summary ===');
  console.log('Look for:');
  console.log('1. HTML responses (indicates routing/middleware issues)');
  console.log('2. Missing businessId association in POST responses');
  console.log('3. Authentication failures or bypasses');
}

runAllTests();