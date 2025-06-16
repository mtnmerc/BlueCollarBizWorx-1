import https from 'https';

async function quickDeploymentTest() {
  console.log('=== QUICK DEPLOYMENT DIAGNOSTIC ===\n');
  
  const hostname = 'bizworx.replit.app';
  
  try {
    // Test 1: Basic connectivity
    console.log('1. Testing basic connectivity...');
    const basicTest = await makeRequest(hostname, '/', {});
    console.log(`Root endpoint: ${basicTest.statusCode} ${basicTest.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Test 2: Health endpoint
    console.log('\n2. Testing health endpoint...');
    const healthTest = await makeRequest(hostname, '/health', {});
    console.log(`Health endpoint: ${healthTest.statusCode} ${healthTest.success ? 'SUCCESS' : 'FAILED'}`);
    if (healthTest.success) {
      console.log('Server response:', healthTest.data);
    }
    
    // Test 3: API endpoint without key
    console.log('\n3. Testing API endpoint without key...');
    const noKeyTest = await makeRequest(hostname, '/api/gpt/clients', {});
    console.log(`No key test: ${noKeyTest.statusCode} - ${noKeyTest.data?.error || noKeyTest.error || 'No error message'}`);
    
    // Test 4: API endpoint with sample key
    console.log('\n4. Testing API endpoint with sample key...');
    const sampleKeyTest = await makeRequest(hostname, '/api/gpt/clients', { 'X-API-Key': 'bw_sample123' });
    console.log(`Sample key test: ${sampleKeyTest.statusCode} - ${sampleKeyTest.data?.error || sampleKeyTest.error || 'No error message'}`);
    
    // Diagnosis
    console.log('\n=== DIAGNOSIS ===');
    
    if (basicTest.statusCode === 404 && healthTest.statusCode === 404) {
      console.log('ISSUE: All endpoints return 404');
      console.log('CAUSE: Deployment failed or application not running');
      console.log('SOLUTION: Redeploy the application');
    } else if (healthTest.success) {
      console.log('SUCCESS: Deployment is running');
      if (sampleKeyTest.data?.error === 'Invalid API key') {
        console.log('API key validation is working - your new key should work');
      } else if (sampleKeyTest.data?.error === 'API key required') {
        console.log('API key authentication is working - provide your new key');
      } else {
        console.log('Unexpected API response - may need investigation');
      }
    } else {
      console.log('PARTIAL: Some endpoints accessible, others not');
      console.log('Check deployment logs for errors');
    }
    
    console.log('\nNext steps:');
    if (healthTest.success) {
      console.log('- Your deployment is working');
      console.log('- Test your new API key with the GPT endpoints');
      console.log('- Update ChatGPT with the new API key');
    } else {
      console.log('- Redeploy your application');
      console.log('- Wait for deployment to complete');
      console.log('- Then test your new API key');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
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
        'User-Agent': 'BizWorx-Test/1.0',
        ...headers
      },
      timeout: 8000
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      
      res.on('end', () => {
        let parsedData = null;
        try {
          parsedData = JSON.parse(responseData);
        } catch (e) {
          // Not JSON
        }
        
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: parsedData,
          raw: responseData.substring(0, 100),
          statusCode: res.statusCode,
          error: res.statusCode >= 400 ? responseData.substring(0, 50) : null
        });
      });
    });

    req.on('error', (err) => resolve({ 
      success: false, 
      error: err.message,
      statusCode: 0
    }));
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        success: false, 
        error: 'timeout',
        statusCode: 0
      });
    });
    
    req.end();
  });
}

quickDeploymentTest();