import http from 'http';

async function testSessionIsolationFix() {
  console.log('=== TESTING SESSION ISOLATION FIX ===\n');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    // Step 1: Login to alter3d24@gmail.com
    console.log('1. Logging into alter3d24@gmail.com...');
    const session1 = await makeRequest('/api/auth/business/login', 'POST', {
      email: 'alter3d24@gmail.com',
      password: 'password123'
    });
    
    if (!session1.success) {
      console.log('❌ alter3d24@gmail.com login failed:', session1.error);
      return;
    }
    
    const cookies1 = session1.headers['set-cookie'] ? session1.headers['set-cookie'][0] : null;
    console.log('✅ alter3d24@gmail.com login successful');
    
    // Step 2: Generate API key for alter3d
    console.log('\n2. Generating API key for alter3d24@gmail.com...');
    const apiKey1 = await makeRequest('/api/business/api-key', 'POST', {}, { Cookie: cookies1 });
    
    if (!apiKey1.success) {
      console.log('❌ API key generation failed for alter3d:', apiKey1.error);
      return;
    }
    
    console.log('✅ API key generated for alter3d:', apiKey1.data.apiKey);
    
    // Step 3: Create a new test business
    console.log('\n3. Creating new test business...');
    const testBusinessData = {
      name: 'Session Test Business',
      email: `session-test-${Date.now()}@example.com`,
      password: 'testpass123',
      phone: '555-0123',
      address: '123 Test St'
    };
    
    const newBusiness = await makeRequest('/api/auth/business/register', 'POST', testBusinessData);
    
    if (!newBusiness.success) {
      console.log('❌ Test business creation failed:', newBusiness.error);
      return;
    }
    
    console.log('✅ Test business created:', testBusinessData.email);
    
    // Step 4: Login to new business with SAME browser session (using original cookies)
    console.log('\n4. Logging into test business with existing session...');
    const session2 = await makeRequest('/api/auth/business/login', 'POST', {
      email: testBusinessData.email,
      password: testBusinessData.password
    }, { Cookie: cookies1 });
    
    if (!session2.success) {
      console.log('❌ Test business login failed:', session2.error);
      return;
    }
    
    console.log('✅ Test business login successful');
    
    // Step 5: Generate API key with the same cookie session (should be isolated now)
    console.log('\n5. Generating API key for test business...');
    const apiKey2 = await makeRequest('/api/business/api-key', 'POST', {}, { Cookie: cookies1 });
    
    if (!apiKey2.success) {
      console.log('❌ API key generation failed for test business:', apiKey2.error);
      return;
    }
    
    console.log('✅ API key generated for test business:', apiKey2.data.apiKey);
    
    // Step 6: Verify which business owns each API key
    console.log('\n6. Verifying API key ownership...');
    
    const owner1 = await verifyApiKeyOwnership(apiKey1.data.apiKey);
    const owner2 = await verifyApiKeyOwnership(apiKey2.data.apiKey);
    
    console.log('First API key belongs to:', owner1.businessEmail);
    console.log('Second API key belongs to:', owner2.businessEmail);
    
    // Step 7: Analysis
    console.log('\n7. SESSION ISOLATION TEST RESULTS:');
    
    if (apiKey1.data.apiKey === apiKey2.data.apiKey) {
      console.log('❌ FAILED: Same API key generated for different businesses!');
      console.log('   This indicates session contamination is still occurring.');
    } else if (owner1.businessEmail === owner2.businessEmail) {
      console.log('❌ FAILED: Different API keys but both belong to same business!');
      console.log('   This indicates session contamination during API generation.');
      console.log(`   Both keys belong to: ${owner1.businessEmail}`);
    } else {
      console.log('✅ SUCCESS: Session isolation working correctly!');
      console.log(`   alter3d API key: ${apiKey1.data.apiKey} → ${owner1.businessEmail}`);
      console.log(`   Test business API key: ${apiKey2.data.apiKey} → ${owner2.businessEmail}`);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

async function verifyApiKeyOwnership(apiKey) {
  const result = await makeRequest('/api/gpt/clients', 'GET', null, { 'X-API-Key': apiKey });
  
  if (result.success && result.data.length > 0) {
    // Get business email from any client record
    const businessId = result.data[0].businessId;
    const business = await makeRequest(`/api/businesses/${businessId}`, 'GET');
    
    return {
      businessId: businessId,
      businessEmail: business.success ? business.data.email : 'Unknown',
      clientCount: result.data.length
    };
  }
  
  // If no clients, try a different approach - use the API key to get business info
  const authTest = await makeRequest('/api/gpt/estimates', 'GET', null, { 'X-API-Key': apiKey });
  
  if (authTest.success) {
    return {
      businessId: 'Unknown',
      businessEmail: 'Authenticated but no data',
      clientCount: 0
    };
  }
  
  return {
    businessId: 'Unknown',
    businessEmail: 'Invalid key',
    clientCount: 0
  };
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

// Start the test
testSessionIsolationFix().then(() => {
  console.log('\n=== SESSION ISOLATION TEST COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});