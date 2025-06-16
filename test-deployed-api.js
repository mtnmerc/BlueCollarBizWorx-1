import https from 'https';
import http from 'http';

async function testDeployedAPI() {
  console.log('=== TESTING DEPLOYED API ENDPOINTS ===\n');
  
  // Get the deployment URL from environment or use default
  const deploymentUrl = process.env.REPLIT_DEPLOYMENT_URL || 'https://bizworx.replit.app';
  const isHttps = deploymentUrl.startsWith('https');
  const hostname = deploymentUrl.replace(/^https?:\/\//, '');
  
  console.log('Testing deployment at:', deploymentUrl);
  
  const knownApiKey = 'bw_wkad606ephtmbqx7a0f';
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResult = await makeDeployedRequest(hostname, '/health', 'GET', null, {}, isHttps);
    console.log('Health check:', healthResult.success ? 'SUCCESS' : 'FAILED');
    if (healthResult.success) {
      console.log('Server status:', healthResult.data?.status);
    } else {
      console.log('Health error:', healthResult.statusCode, healthResult.error);
    }
    
    // Test 2: GPT Clients endpoint
    console.log('\n2. Testing GPT clients endpoint...');
    const clientsResult = await makeDeployedRequest(hostname, '/api/gpt/clients', 'GET', null, { 'X-API-Key': knownApiKey }, isHttps);
    console.log('Clients endpoint:', clientsResult.success ? 'SUCCESS' : 'FAILED');
    if (clientsResult.success) {
      console.log('Retrieved', clientsResult.data?.length || 0, 'clients');
    } else {
      console.log('Clients error:', clientsResult.statusCode, clientsResult.data?.error || clientsResult.error);
    }
    
    // Test 3: GPT Estimates endpoint  
    console.log('\n3. Testing GPT estimates endpoint...');
    const estimatesResult = await makeDeployedRequest(hostname, '/api/gpt/estimates', 'GET', null, { 'X-API-Key': knownApiKey }, isHttps);
    console.log('Estimates endpoint:', estimatesResult.success ? 'SUCCESS' : 'FAILED');
    if (estimatesResult.success) {
      console.log('Retrieved', estimatesResult.data?.length || 0, 'estimates');
    } else {
      console.log('Estimates error:', estimatesResult.statusCode, estimatesResult.data?.error || estimatesResult.error);
    }
    
    // Test 4: GPT Invoices endpoint
    console.log('\n4. Testing GPT invoices endpoint...');
    const invoicesResult = await makeDeployedRequest(hostname, '/api/gpt/invoices', 'GET', null, { 'X-API-Key': knownApiKey }, isHttps);
    console.log('Invoices endpoint:', invoicesResult.success ? 'SUCCESS' : 'FAILED');
    if (invoicesResult.success) {
      console.log('Retrieved', invoicesResult.data?.length || 0, 'invoices');
    } else {
      console.log('Invoices error:', invoicesResult.statusCode, invoicesResult.data?.error || invoicesResult.error);
    }
    
    // Test 5: GPT Jobs endpoint
    console.log('\n5. Testing GPT jobs endpoint...');
    const jobsResult = await makeDeployedRequest(hostname, '/api/gpt/jobs', 'GET', null, { 'X-API-Key': knownApiKey }, isHttps);
    console.log('Jobs endpoint:', jobsResult.success ? 'SUCCESS' : 'FAILED');
    if (jobsResult.success) {
      console.log('Retrieved', jobsResult.data?.length || 0, 'jobs');
    } else {
      console.log('Jobs error:', jobsResult.statusCode, jobsResult.data?.error || jobsResult.error);
    }
    
    // Test 6: Authentication validation
    console.log('\n6. Testing authentication...');
    const noKeyResult = await makeDeployedRequest(hostname, '/api/gpt/clients', 'GET', null, {}, isHttps);
    console.log('No API key test:', noKeyResult.success ? 'UNEXPECTED SUCCESS' : 'CORRECTLY FAILED');
    console.log('Response:', noKeyResult.data?.error || noKeyResult.error);
    
    const invalidKeyResult = await makeDeployedRequest(hostname, '/api/gpt/clients', 'GET', null, { 'X-API-Key': 'invalid_key' }, isHttps);
    console.log('Invalid API key test:', invalidKeyResult.success ? 'UNEXPECTED SUCCESS' : 'CORRECTLY FAILED');
    console.log('Response:', invalidKeyResult.data?.error || invalidKeyResult.error);
    
    // Test 7: Alternative authentication methods
    console.log('\n7. Testing Bearer token format...');
    const bearerResult = await makeDeployedRequest(hostname, '/api/gpt/clients', 'GET', null, { 'Authorization': `Bearer ${knownApiKey}` }, isHttps);
    console.log('Bearer format:', bearerResult.success ? 'SUCCESS' : 'FAILED');
    if (!bearerResult.success) {
      console.log('Bearer error:', bearerResult.statusCode, bearerResult.data?.error || bearerResult.error);
    }
    
    console.log('\n=== SUMMARY ===');
    const workingEndpoints = [clientsResult, estimatesResult, invoicesResult, jobsResult].filter(r => r.success);
    
    if (workingEndpoints.length > 0) {
      console.log(`✅ ${workingEndpoints.length}/4 GPT endpoints are working`);
      console.log('The API is functional and ChatGPT should be able to connect');
    } else {
      console.log('❌ All GPT endpoints are failing');
      if (healthResult.success) {
        console.log('Server is running but API authentication may have issues');
      } else {
        console.log('Server may not be deployed or accessible');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function makeDeployedRequest(hostname, path, method = 'GET', data = null, headers = {}, isHttps = true) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: hostname,
      port: isHttps ? 443 : 80,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BizWorx-Test/1.0',
        ...headers
      }
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const client = isHttps ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            data: parsed,
            statusCode: res.statusCode,
            headers: res.headers
          });
        } catch (e) {
          resolve({ 
            success: false, 
            error: 'Invalid JSON response',
            raw: responseData,
            statusCode: res.statusCode
          });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

testDeployedAPI().then(() => {
  console.log('\n=== DEPLOYED API TEST COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});