import http from 'http';

// Test to prove session contamination between business accounts
async function testSessionContamination() {
  console.log('=== SESSION CONTAMINATION TEST ===\n');
  
  // Step 1: Login to first business account
  console.log('1. Logging into alter3d24@gmail.com business...');
  const session1 = await loginToBusiness('alter3d24@gmail.com', 'password123');
  if (!session1.success) {
    console.log('❌ First business login failed');
    return;
  }
  
  const cookies1 = session1.cookies;
  console.log('✅ Business 1 login successful');
  console.log('Session cookies:', cookies1);
  
  // Step 2: Check what's in session after first login
  console.log('\n2. Checking session data after first business login...');
  const session1Data = await checkSession(cookies1);
  console.log('Session data:', session1Data);
  
  // Step 3: Login to second business account (same session)
  console.log('\n3. Logging into different business account with same session...');
  const session2 = await loginToBusiness('admin@flatlineearthworks.com', 'password123', cookies1);
  if (!session2.success) {
    console.log('❌ Second business login failed');
    return;
  }
  
  console.log('✅ Business 2 login successful');
  
  // Step 4: Check session data after second login - this will show contamination
  console.log('\n4. Checking session data after second business login...');
  const session2Data = await checkSession(cookies1);
  console.log('Session data after second login:', session2Data);
  
  // Step 5: Generate API key - see which business it belongs to
  console.log('\n5. Generating API key with contaminated session...');
  const apiKeyResult = await generateApiKey(cookies1);
  console.log('API key result:', apiKeyResult);
  
  // Step 6: Check which business owns this API key
  if (apiKeyResult.success && apiKeyResult.data && apiKeyResult.data.apiKey) {
    console.log('\n6. Checking which business owns this API key...');
    const ownerCheck = await checkApiKeyOwner(apiKeyResult.data.apiKey);
    console.log('API key owner:', ownerCheck);
  }
}

async function loginToBusiness(email, password, existingCookies = null) {
  return new Promise((resolve) => {
    const loginData = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/business/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    if (existingCookies) {
      options.headers['Cookie'] = existingCookies;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            data: parsed,
            cookies: existingCookies || (res.headers['set-cookie'] ? res.headers['set-cookie'][0] : null)
          });
        } catch (e) {
          resolve({ success: false, error: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.write(loginData);
    req.end();
  });
}

async function checkSession(cookies) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/me',
      method: 'GET',
      headers: { 'Cookie': cookies }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve({ error: 'Invalid JSON response', raw: data });
        }
      });
    });

    req.on('error', (err) => resolve({ error: err.message }));
    req.end();
  });
}

async function generateApiKey(cookies) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/business/api-key',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': 2,
        'Cookie': cookies
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ success: res.statusCode === 200, data: parsed });
        } catch (e) {
          resolve({ success: false, error: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.write('{}');
    req.end();
  });
}

async function checkApiKeyOwner(apiKey) {
  // This would require a database query, but we can check by trying to use the API key
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/gpt/clients',
      method: 'GET',
      headers: { 'X-API-Key': apiKey }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success && parsed.data && parsed.data.length > 0) {
            // Check the business info from first client
            resolve({ 
              success: true, 
              clientCount: parsed.data.length,
              firstClientBusiness: parsed.data[0].businessId || 'Unknown'
            });
          } else {
            resolve({ success: false, data: parsed });
          }
        } catch (e) {
          resolve({ success: false, error: 'Invalid JSON response' });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.end();
  });
}

testSessionContamination();