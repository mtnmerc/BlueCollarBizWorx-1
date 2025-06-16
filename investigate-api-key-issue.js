import http from 'http';

async function investigateApiKeyIssue() {
  console.log('=== INVESTIGATING API KEY AUTHENTICATION ISSUE ===\n');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    console.log('1. Testing existing API keys from database...');
    
    // Test with the known working API key
    const knownApiKey = 'bw_wkad606ephtmbqx7a0f'; // From previous investigations
    console.log(`Testing known API key: ${knownApiKey}`);
    
    const clientsTest = await makeRequest('/api/gpt/clients', 'GET', null, { 'X-API-Key': knownApiKey });
    console.log('Clients endpoint test:', clientsTest.success ? 'SUCCESS' : 'FAILED');
    if (!clientsTest.success) {
      console.log('Error:', clientsTest.statusCode, clientsTest.data || clientsTest.error);
    } else {
      console.log('Retrieved', clientsTest.data?.length || 0, 'clients');
    }
    
    const estimatesTest = await makeRequest('/api/gpt/estimates', 'GET', null, { 'X-API-Key': knownApiKey });
    console.log('Estimates endpoint test:', estimatesTest.success ? 'SUCCESS' : 'FAILED');
    if (!estimatesTest.success) {
      console.log('Error:', estimatesTest.statusCode, estimatesTest.data || estimatesTest.error);
    }
    
    const invoicesTest = await makeRequest('/api/gpt/invoices', 'GET', null, { 'X-API-Key': knownApiKey });
    console.log('Invoices endpoint test:', invoicesTest.success ? 'SUCCESS' : 'FAILED');
    if (!invoicesTest.success) {
      console.log('Error:', invoicesTest.statusCode, invoicesTest.data || invoicesTest.error);
    }
    
    const jobsTest = await makeRequest('/api/gpt/jobs', 'GET', null, { 'X-API-Key': knownApiKey });
    console.log('Jobs endpoint test:', jobsTest.success ? 'SUCCESS' : 'FAILED');
    if (!jobsTest.success) {
      console.log('Error:', jobsTest.statusCode, jobsTest.data || jobsTest.error);
    }
    
    console.log('\n2. Testing without API key (should fail)...');
    const noKeyTest = await makeRequest('/api/gpt/clients', 'GET');
    console.log('No API key test:', noKeyTest.success ? 'UNEXPECTED SUCCESS' : 'CORRECTLY FAILED');
    console.log('Status:', noKeyTest.statusCode, 'Response:', noKeyTest.data?.error || noKeyTest.error);
    
    console.log('\n3. Testing with invalid API key (should fail)...');
    const invalidKeyTest = await makeRequest('/api/gpt/clients', 'GET', null, { 'X-API-Key': 'invalid_key_123' });
    console.log('Invalid API key test:', invalidKeyTest.success ? 'UNEXPECTED SUCCESS' : 'CORRECTLY FAILED');
    console.log('Status:', invalidKeyTest.statusCode, 'Response:', invalidKeyTest.data?.error || invalidKeyTest.error);
    
    console.log('\n4. Testing server health...');
    const healthTest = await makeRequest('/health', 'GET');
    console.log('Health check:', healthTest.success ? 'SUCCESS' : 'FAILED');
    if (healthTest.success) {
      console.log('Server response:', healthTest.data);
    }
    
    console.log('\n5. Testing alternative API key formats...');
    
    // Test with Bearer format (might be expected by GPT)
    const bearerTest = await makeRequest('/api/gpt/clients', 'GET', null, { 'Authorization': `Bearer ${knownApiKey}` });
    console.log('Bearer format test:', bearerTest.success ? 'SUCCESS' : 'FAILED');
    if (!bearerTest.success) {
      console.log('Status:', bearerTest.statusCode, 'Response:', bearerTest.data?.error || bearerTest.error);
    }
    
    // Test with case sensitivity
    const upperCaseHeaderTest = await makeRequest('/api/gpt/clients', 'GET', null, { 'X-Api-Key': knownApiKey });
    console.log('Case-sensitive header test:', upperCaseHeaderTest.success ? 'SUCCESS' : 'FAILED');
    
    console.log('\n6. Summary of findings:');
    if (clientsTest.success || estimatesTest.success || invoicesTest.success || jobsTest.success) {
      console.log('✅ At least one GPT endpoint is working with API key');
    } else {
      console.log('❌ ALL GPT endpoints are failing');
    }
    
    if (noKeyTest.success) {
      console.log('❌ SECURITY ISSUE: Endpoints working without API key');
    } else {
      console.log('✅ API key requirement is enforced');
    }
    
  } catch (error) {
    console.error('Investigation failed:', error);
  }
}

async function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
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

investigateApiKeyIssue().then(() => {
  console.log('\n=== API KEY INVESTIGATION COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Investigation failed:', error);
  process.exit(1);
});