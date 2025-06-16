import https from 'https';
import http from 'http';

async function testNewApiKey() {
  console.log('=== TESTING NEW API KEY ===\n');
  
  // Test both local and deployed environments
  console.log('Testing your regenerated API key in both environments...\n');
  
  // You'll need to replace this with your actual new API key
  const newApiKey = process.argv[2] || 'PLEASE_PROVIDE_YOUR_NEW_API_KEY';
  
  if (newApiKey === 'PLEASE_PROVIDE_YOUR_NEW_API_KEY') {
    console.log('Please run: node test-new-api-key.js YOUR_NEW_API_KEY');
    process.exit(1);
  }
  
  console.log(`Testing API key: ${newApiKey}\n`);
  
  // Test 1: Local environment (development)
  console.log('1. Testing LOCAL ENVIRONMENT (development server)...');
  const localResults = await testEnvironment('localhost', 5000, newApiKey, false);
  
  // Test 2: Deployed environment (production)  
  console.log('\n2. Testing DEPLOYED ENVIRONMENT (production)...');
  const deployedResults = await testEnvironment('bizworx.replit.app', 443, newApiKey, true);
  
  // Analysis
  console.log('\n=== ANALYSIS ===');
  
  if (localResults.accessible && localResults.authenticated) {
    console.log('✅ LOCAL: New API key works in development');
  } else if (localResults.accessible && !localResults.authenticated) {
    console.log('❌ LOCAL: Server running but API key invalid');
  } else {
    console.log('❌ LOCAL: Development server not running');
  }
  
  if (deployedResults.accessible && deployedResults.authenticated) {
    console.log('✅ DEPLOYED: New API key works in production');
    console.log('🎯 ChatGPT should be able to connect successfully');
  } else if (deployedResults.accessible && !deployedResults.authenticated) {
    console.log('❌ DEPLOYED: Server running but API key invalid');
    console.log('   - API key may not have synced to production database');
    console.log('   - Try regenerating the API key after deployment is fully complete');
  } else {
    console.log('❌ DEPLOYED: Production deployment not accessible');
    console.log('   - Redeployment may still be in progress');
    console.log('   - Or deployment failed to start properly');
  }
  
  // Recommendations
  console.log('\n=== RECOMMENDATIONS ===');
  
  if (!deployedResults.accessible) {
    console.log('1. Check deployment status - it may still be deploying');
    console.log('2. Wait a few minutes and test again');
    console.log('3. If still failing, redeploy the application');
  } else if (deployedResults.accessible && !deployedResults.authenticated) {
    console.log('1. The deployment is working but your API key needs to be regenerated');
    console.log('2. Log into your business account on the deployed site');
    console.log('3. Generate a new API key through the business settings');
    console.log('4. Update your ChatGPT configuration with the new key');
  } else if (deployedResults.accessible && deployedResults.authenticated) {
    console.log('1. Everything is working correctly!');
    console.log('2. Use this API key in your ChatGPT configuration');
    console.log('3. Test your ChatGPT Custom GPT integration');
  }
}

async function testEnvironment(hostname, port, apiKey, isHttps) {
  const envName = isHttps ? 'PRODUCTION' : 'DEVELOPMENT';
  console.log(`Testing ${envName} at ${hostname}:${port}`);
  
  const results = {
    accessible: false,
    authenticated: false,
    endpoints: {},
    errors: []
  };
  
  try {
    // Test health endpoint first
    const healthResult = await makeRequestForEnv(hostname, port, '/health', {}, isHttps);
    if (healthResult.success) {
      results.accessible = true;
      console.log(`✅ ${envName}: Server is accessible`);
    } else {
      console.log(`❌ ${envName}: Server not accessible (${healthResult.statusCode})`);
      results.errors.push(`Health check failed: ${healthResult.statusCode}`);
      return results;
    }
    
    // Test GPT endpoints with API key
    const endpoints = [
      '/api/gpt/clients',
      '/api/gpt/estimates', 
      '/api/gpt/invoices',
      '/api/gpt/jobs'
    ];
    
    let successCount = 0;
    
    for (const endpoint of endpoints) {
      const result = await makeRequestForEnv(hostname, port, endpoint, { 'X-API-Key': apiKey }, isHttps);
      results.endpoints[endpoint] = result;
      
      if (result.success) {
        successCount++;
        console.log(`✅ ${envName}: ${endpoint} - SUCCESS (${Array.isArray(result.data) ? result.data.length + ' items' : 'data returned'})`);
      } else {
        console.log(`❌ ${envName}: ${endpoint} - FAILED (${result.statusCode}: ${result.data?.error || result.error || 'Unknown error'})`);
        results.errors.push(`${endpoint}: ${result.data?.error || result.error}`);
      }
    }
    
    if (successCount > 0) {
      results.authenticated = true;
      console.log(`✅ ${envName}: API key authentication working (${successCount}/${endpoints.length} endpoints)`);
    } else {
      console.log(`❌ ${envName}: API key authentication failed on all endpoints`);
    }
    
  } catch (error) {
    console.log(`❌ ${envName}: Test failed - ${error.message}`);
    results.errors.push(error.message);
  }
  
  return results;
}

async function makeRequestForEnv(hostname, port, path, headers = {}, isHttps = false) {
  return new Promise((resolve) => {
    const options = {
      hostname: hostname,
      port: port,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BizWorx-API-Test/1.0',
        ...headers
      },
      timeout: 10000
    };

    const client = isHttps ? https : http;
    
    const req = client.request(options, (res) => {
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
          raw: responseData.substring(0, 200),
          statusCode: res.statusCode
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
        error: 'Request timeout',
        statusCode: 0
      });
    });
    
    req.end();
  });
}

// Get API key from command line argument
testNewApiKey().then(() => {
  console.log('\n=== NEW API KEY TEST COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});