import https from 'https';

async function testApiKeyPostDeployment() {
  console.log('=== TESTING API KEY AFTER DEPLOYMENT ===\n');
  
  const hostname = 'bizworx.replit.app';
  const knownApiKey = 'bw_wkad606ephtmbqx7a0f';
  
  try {
    // Test 1: Check if deployment is accessible
    console.log('1. Testing deployment accessibility...');
    const healthResult = await makeRequest(hostname, '/health');
    console.log('Health endpoint:', healthResult.success ? 'ACCESSIBLE' : 'FAILED');
    if (healthResult.success) {
      console.log('Server response:', healthResult.data);
    } else {
      console.log('Status:', healthResult.statusCode, 'Error:', healthResult.error || healthResult.raw?.substring(0, 100));
    }
    
    // Test 2: Test known API key
    console.log('\n2. Testing known API key...');
    const clientsTest = await makeRequest(hostname, '/api/gpt/clients', { 'X-API-Key': knownApiKey });
    console.log('Known API key test:', clientsTest.success ? 'SUCCESS' : 'FAILED');
    if (!clientsTest.success) {
      console.log('Status:', clientsTest.statusCode);
      console.log('Response:', clientsTest.data?.error || clientsTest.error || clientsTest.raw?.substring(0, 200));
    } else {
      console.log('Retrieved', clientsTest.data?.length || 0, 'clients');
    }
    
    // Test 3: Check if API key format changed
    console.log('\n3. Testing different API key formats...');
    
    // Try with Authorization header
    const authHeaderTest = await makeRequest(hostname, '/api/gpt/clients', { 'Authorization': `Bearer ${knownApiKey}` });
    console.log('Authorization header test:', authHeaderTest.success ? 'SUCCESS' : 'FAILED');
    if (!authHeaderTest.success) {
      console.log('Auth header error:', authHeaderTest.data?.error || authHeaderTest.error);
    }
    
    // Try with different case
    const caseTest = await makeRequest(hostname, '/api/gpt/clients', { 'x-api-key': knownApiKey });
    console.log('Lowercase header test:', caseTest.success ? 'SUCCESS' : 'FAILED');
    
    // Test 4: Test all GPT endpoints
    console.log('\n4. Testing all GPT endpoints with known API key...');
    const endpoints = [
      '/api/gpt/clients',
      '/api/gpt/estimates', 
      '/api/gpt/invoices',
      '/api/gpt/jobs'
    ];
    
    for (const endpoint of endpoints) {
      const result = await makeRequest(hostname, endpoint, { 'X-API-Key': knownApiKey });
      console.log(`${endpoint}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      if (!result.success) {
        console.log(`  Error: ${result.data?.error || result.error || 'HTTP ' + result.statusCode}`);
      } else if (result.data) {
        console.log(`  Data: ${Array.isArray(result.data) ? result.data.length + ' items' : 'Object returned'}`);
      }
    }
    
    // Test 5: Test authentication validation
    console.log('\n5. Testing authentication validation...');
    
    // No API key test
    const noKeyResult = await makeRequest(hostname, '/api/gpt/clients');
    console.log('No API key test:', noKeyResult.success ? 'UNEXPECTED SUCCESS' : 'CORRECTLY FAILED');
    if (!noKeyResult.success) {
      console.log('No key error:', noKeyResult.data?.error || noKeyResult.error);
    }
    
    // Invalid API key test
    const invalidKeyResult = await makeRequest(hostname, '/api/gpt/clients', { 'X-API-Key': 'invalid_test_key' });
    console.log('Invalid API key test:', invalidKeyResult.success ? 'UNEXPECTED SUCCESS' : 'CORRECTLY FAILED');
    if (!invalidKeyResult.success) {
      console.log('Invalid key error:', invalidKeyResult.data?.error || invalidKeyResult.error);
    }
    
    // Test 6: Check if API keys in database are still valid
    console.log('\n6. Diagnosis based on results...');
    
    if (healthResult.success) {
      console.log('✅ Deployment is running and accessible');
      
      if (clientsTest.success) {
        console.log('✅ API key authentication is working');
        console.log('The "invalid API key" error may be from a different key or temporary issue');
      } else {
        if (clientsTest.data?.error === 'Invalid API key') {
          console.log('❌ Known API key is now invalid');
          console.log('Possible causes:');
          console.log('  - Database was reset during deployment');
          console.log('  - API key validation logic changed');
          console.log('  - Session isolation fix affected existing keys');
        } else if (clientsTest.data?.error === 'API key required') {
          console.log('❌ API key not being recognized in header');
          console.log('Possible header format issue in deployment');
        } else {
          console.log('❌ Unexpected authentication error');
          console.log('May need to investigate server logs');
        }
      }
    } else {
      console.log('❌ Deployment is not accessible');
      console.log('The "invalid API key" error may be because the server is not running');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function makeRequest(hostname, path, headers = {}) {
  return new Promise((resolve) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BizWorx-API-Test/1.0',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      
      res.on('end', () => {
        let parsedData = null;
        try {
          parsedData = JSON.parse(responseData);
        } catch (e) {
          // Not JSON, keep raw data
        }
        
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: parsedData,
          raw: responseData,
          statusCode: res.statusCode,
          headers: res.headers
        });
      });
    });

    req.on('error', (err) => resolve({ 
      success: false, 
      error: err.message,
      statusCode: 0
    }));
    
    req.end();
  });
}

testApiKeyPostDeployment().then(() => {
  console.log('\n=== API KEY POST-DEPLOYMENT TEST COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});