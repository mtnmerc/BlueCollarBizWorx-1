import http from 'http';

// Test business login endpoint directly
async function testBusinessLogin() {
  const loginData = JSON.stringify({
    email: 'admin@flatlineearthworks.com',
    password: 'password123'
  });
  
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

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Login Status: ${res.statusCode}`);
      console.log(`Login Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Login Response Length:', data.length);
        console.log('First 200 chars:', data.substring(0, 200));
        
        if (data.includes('<!DOCTYPE html>')) {
          console.log('❌ Received HTML instead of JSON - API endpoint not working');
          resolve({ success: false, html: true });
        } else {
          try {
            const parsed = JSON.parse(data);
            console.log('✅ Valid JSON response');
            console.log('Response:', JSON.stringify(parsed, null, 2));
            resolve({ success: true, data: parsed, cookies: res.headers['set-cookie'] });
          } catch (e) {
            console.log('❌ Invalid JSON:', e.message);
            resolve({ success: false, parseError: true });
          }
        }
      });
    });

    req.on('error', (err) => {
      console.log('Request error:', err);
      reject(err);
    });

    req.write(loginData);
    req.end();
  });
}

// Test API endpoints without starting server (assume server is running)
async function testDirectEndpoints() {
  console.log('Testing business login endpoint...');
  
  try {
    const result = await testBusinessLogin();
    
    if (result.success && result.data) {
      console.log('Business login successful');
      
      // Now test API key generation
      if (result.cookies) {
        console.log('Testing API key generation with session...');
        await testApiKeyWithSession(result.cookies[0]);
      } else {
        console.log('No session cookies received');
      }
    } else {
      console.log('Business login failed');
    }
  } catch (error) {
    console.log('Test failed:', error.message);
  }
}

async function testApiKeyWithSession(cookie) {
  const postData = JSON.stringify({});
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/business/api-key',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'Cookie': cookie
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`API Key Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('API Key Response:', data);
        
        try {
          const parsed = JSON.parse(data);
          if (parsed.success && parsed.data && parsed.data.apiKey) {
            console.log('✅ API key generated successfully:', parsed.data.apiKey);
          } else if (parsed.error) {
            console.log('❌ API generation failed:', parsed.error);
          }
        } catch (e) {
          console.log('❌ Invalid JSON response:', e.message);
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log('API Key request error:', err);
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

testDirectEndpoints();