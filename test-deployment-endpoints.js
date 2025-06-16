import https from 'https';

async function testDeploymentEndpoints() {
  console.log('=== TESTING DEPLOYMENT ENDPOINT ACCESSIBILITY ===\n');
  
  const baseUrl = 'bizworx.replit.app';
  
  try {
    // Test different possible API paths
    const testPaths = [
      '/',
      '/health',
      '/api/health', 
      '/api/gpt/clients',
      '/api/auth/business/login',
      '/server/health'
    ];
    
    console.log('Testing various endpoint paths...\n');
    
    for (const path of testPaths) {
      console.log(`Testing: ${path}`);
      const result = await makeRequest(baseUrl, path);
      console.log(`  Status: ${result.statusCode}`);
      console.log(`  Response type: ${result.contentType || 'unknown'}`);
      if (result.success) {
        console.log(`  ✅ Accessible`);
      } else {
        console.log(`  ❌ Failed: ${result.error || 'HTTP ' + result.statusCode}`);
      }
      console.log('');
    }
    
    // Test with API key if any endpoints are accessible
    console.log('Testing with API key authentication...\n');
    const apiKey = 'bw_wkad606ephtmbqx7a0f';
    
    const gptPaths = [
      '/api/gpt/clients',
      '/api/gpt/estimates', 
      '/api/gpt/invoices',
      '/api/gpt/jobs'
    ];
    
    for (const path of gptPaths) {
      console.log(`Testing with API key: ${path}`);
      const result = await makeRequest(baseUrl, path, { 'X-API-Key': apiKey });
      console.log(`  Status: ${result.statusCode}`);
      if (result.success) {
        console.log(`  ✅ API accessible`);
        if (result.data && Array.isArray(result.data)) {
          console.log(`  Data: ${result.data.length} items`);
        }
      } else {
        console.log(`  ❌ Failed: ${result.error || 'HTTP ' + result.statusCode}`);
        if (result.data && result.data.error) {
          console.log(`  Error: ${result.data.error}`);
        }
      }
      console.log('');
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
        const contentType = res.headers['content-type'] || '';
        let parsedData = null;
        let parseError = null;
        
        if (contentType.includes('application/json')) {
          try {
            parsedData = JSON.parse(responseData);
          } catch (e) {
            parseError = 'Invalid JSON';
          }
        }
        
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 300,
          data: parsedData,
          raw: responseData.substring(0, 200), // First 200 chars for debugging
          statusCode: res.statusCode,
          contentType: contentType,
          error: parseError,
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

testDeploymentEndpoints().then(() => {
  console.log('=== DEPLOYMENT ENDPOINT TEST COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});