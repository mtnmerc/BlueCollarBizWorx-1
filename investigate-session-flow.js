import http from 'http';

async function investigateSessionFlow() {
  console.log('=== PHASE 3: SESSION & AUTHENTICATION FLOW ===\n');
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Test 1: Login to alter3d24@gmail.com and check session
    console.log('1. Testing alter3d24@gmail.com login flow...');
    const session1 = await loginAndCheckSession('alter3d24@gmail.com', 'password123');
    
    if (!session1.success) {
      console.log('❌ alter3d24@gmail.com login failed');
      return;
    }
    
    console.log('✅ alter3d24@gmail.com login successful');
    console.log('Business data from login:', session1.businessData);
    console.log('Session check result:', session1.sessionData);
    
    // Test 2: Generate API key for alter3d business
    console.log('\n2. Generating API key for alter3d24@gmail.com...');
    const apiKey1 = await generateApiKeyWithSession(session1.cookies);
    console.log('API key generation result:', apiKey1);
    
    if (apiKey1.success) {
      console.log('Generated API key:', apiKey1.data.apiKey);
      
      // Test 3: Verify API key ownership
      console.log('\n3. Verifying API key ownership...');
      const ownership1 = await testApiKeyOwnership(apiKey1.data.apiKey);
      console.log('API key ownership test:', ownership1);
    }
    
    // Test 4: Create a new business account for testing
    console.log('\n4. Creating test business account...');
    const testBusiness = await createTestBusiness();
    
    if (testBusiness.success) {
      console.log('✅ Test business created:', testBusiness.data.email);
      
      // Test 5: Login to new business with SAME session (simulating browser behavior)
      console.log('\n5. Logging into test business with existing session...');
      const session2 = await loginWithExistingSession(
        testBusiness.data.email, 
        'testpass123', 
        session1.cookies
      );
      
      if (session2.success) {
        console.log('✅ Test business login successful');
        console.log('Session data after second login:', session2.sessionData);
        
        // Test 6: Generate API key with potentially contaminated session
        console.log('\n6. Generating API key with potentially contaminated session...');
        const apiKey2 = await generateApiKeyWithSession(session1.cookies);
        console.log('Second API key generation result:', apiKey2);
        
        if (apiKey2.success) {
          console.log('Second API key:', apiKey2.data.apiKey);
          
          // Test 7: Check which business owns the second API key
          console.log('\n7. Checking ownership of second API key...');
          const ownership2 = await testApiKeyOwnership(apiKey2.data.apiKey);
          console.log('Second API key ownership:', ownership2);
          
          // Test 8: Compare API keys and ownership
          console.log('\n8. ANALYSIS - Comparing API key ownership...');
          if (apiKey1.success && apiKey2.success) {
            console.log(`First API key (alter3d): ${apiKey1.data.apiKey}`);
            console.log(`Second API key (test biz): ${apiKey2.data.apiKey}`);
            
            if (apiKey1.data.apiKey === apiKey2.data.apiKey) {
              console.log('❌ ISSUE CONFIRMED: Same API key generated for different businesses!');
            } else {
              console.log('✅ Different API keys generated - investigating ownership...');
              
              if (ownership1.businessEmail === ownership2.businessEmail) {
                console.log('❌ ISSUE CONFIRMED: Both API keys belong to same business!');
                console.log('Both keys belong to:', ownership1.businessEmail);
              } else {
                console.log('✅ API keys belong to different businesses');
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Session flow investigation failed:', error);
  }
}

async function loginAndCheckSession(email, password) {
  const loginResult = await makeRequest('/api/auth/business/login', 'POST', { email, password });
  
  if (!loginResult.success) {
    return { success: false, error: loginResult.error };
  }
  
  const cookies = loginResult.headers['set-cookie'] ? loginResult.headers['set-cookie'][0] : null;
  
  // Check session data
  const sessionCheck = await makeRequest('/api/auth/me', 'GET', null, { Cookie: cookies });
  
  return {
    success: true,
    businessData: loginResult.data,
    sessionData: sessionCheck.data,
    cookies: cookies
  };
}

async function loginWithExistingSession(email, password, existingCookies) {
  const loginResult = await makeRequest('/api/auth/business/login', 'POST', { email, password }, { Cookie: existingCookies });
  
  if (!loginResult.success) {
    return { success: false, error: loginResult.error };
  }
  
  // Check session data after login
  const sessionCheck = await makeRequest('/api/auth/me', 'GET', null, { Cookie: existingCookies });
  
  return {
    success: true,
    businessData: loginResult.data,
    sessionData: sessionCheck.data
  };
}

async function generateApiKeyWithSession(cookies) {
  return await makeRequest('/api/business/api-key', 'POST', {}, { Cookie: cookies });
}

async function testApiKeyOwnership(apiKey) {
  // Use the API key to make a request and see which business's data is returned
  const clientsResult = await makeRequest('/api/gpt/clients', 'GET', null, { 'X-API-Key': apiKey });
  
  if (clientsResult.success && clientsResult.data && clientsResult.data.length > 0) {
    return {
      success: true,
      businessId: clientsResult.data[0].businessId,
      clientCount: clientsResult.data.length
    };
  }
  
  return { success: false, data: clientsResult };
}

async function createTestBusiness() {
  const businessData = {
    name: 'Test Session Business',
    email: `test-session-${Date.now()}@example.com`,
    password: 'testpass123',
    phone: '555-0123',
    address: '123 Test St'
  };
  
  return await makeRequest('/api/auth/business/register', 'POST', businessData);
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

investigateSessionFlow().then(() => {
  console.log('\n=== SESSION FLOW INVESTIGATION COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Investigation failed:', error);
  process.exit(1);
});