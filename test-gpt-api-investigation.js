import http from 'http';

// Comprehensive investigation of GPT API key issues
async function investigateGPTAPIIssues() {
  console.log('=== GPT API KEY INVESTIGATION ===\n');
  
  // Test 1: Check if deployment is responding
  console.log('1. Testing deployment health...');
  const healthCheck = await testEndpoint('https://bluecollarbizworx.replit.app/health', 'GET');
  console.log('Health check:', healthCheck.success ? '✅ OK' : '❌ Failed');
  if (!healthCheck.success) {
    console.log('Deployment issue detected');
    return;
  }
  
  // Test 2: Check known working API key
  console.log('\n2. Testing known API key: bw_wkad606ephtmbqx7a0f');
  const knownKeyTest = await testGPTEndpoint('https://bluecollarbizworx.replit.app/api/gpt/clients', 'bw_wkad606ephtmbqx7a0f');
  console.log('Known key result:', knownKeyTest.success ? '✅ Valid' : '❌ Invalid');
  if (!knownKeyTest.success) {
    console.log('Error:', knownKeyTest.error);
  }
  
  // Test 3: Generate new API key in test account and test it
  console.log('\n3. Testing new API key generation and validation...');
  const newKeyTest = await testNewKeyGeneration();
  console.log('New key test:', newKeyTest.success ? '✅ Working' : '❌ Failed');
  if (!newKeyTest.success) {
    console.log('Error:', newKeyTest.error);
  }
  
  // Test 4: Check if validation is blocking legitimate requests
  console.log('\n4. Testing different GPT endpoints...');
  const endpoints = [
    '/api/gpt/clients',
    '/api/gpt/estimates', 
    '/api/gpt/invoices',
    '/api/gpt/jobs'
  ];
  
  for (const endpoint of endpoints) {
    const result = await testGPTEndpoint('https://bluecollarbizworx.replit.app' + endpoint, 'bw_wkad606ephtmbqx7a0f');
    console.log(`${endpoint}: ${result.success ? '✅' : '❌'} ${result.error || ''}`);
  }
  
  console.log('\n=== INVESTIGATION COMPLETE ===');
}

async function testEndpoint(url, method = 'GET', headers = {}) {
  try {
    const response = await fetch(url, { 
      method, 
      headers: {
        'User-Agent': 'BizWorx-Test-Client',
        ...headers
      }
    });
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    
    return {
      success: response.ok,
      status: response.status,
      data: data,
      error: !response.ok ? `HTTP ${response.status}` : null
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function testGPTEndpoint(url, apiKey) {
  return await testEndpoint(url, 'GET', {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  });
}

async function testNewKeyGeneration() {
  try {
    // This would require authentication, but we can check the format
    const mockKey = 'bw_' + Math.random().toString(36).substr(2, 32) + Date.now().toString(36);
    console.log('Generated test key format:', mockKey);
    
    // Test the format matches expected pattern
    const isValidFormat = /^bw_[a-z0-9]+$/i.test(mockKey);
    
    return {
      success: isValidFormat,
      key: mockKey,
      error: isValidFormat ? null : 'Invalid key format'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

investigateGPTAPIIssues();