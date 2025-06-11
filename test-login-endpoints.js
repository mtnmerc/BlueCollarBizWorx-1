import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testLoginEndpoints() {
  console.log('=== TESTING LOGIN AUTHENTICATION ENDPOINTS ===\n');
  
  // Test business login with default credentials
  try {
    console.log('Testing business login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/business/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Client/1.0'
      },
      body: JSON.stringify({
        email: 'alter3d24@gmail.com',
        password: 'password123'
      })
    });
    
    console.log(`Status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('✅ Business login working');
      console.log(`Business: ${data.business?.name}`);
      console.log(`Admin user exists: ${data.user ? 'Yes' : 'No'}`);
    } else {
      const errorText = await loginResponse.text();
      console.log('❌ Business login failed');
      console.log(`Error: ${errorText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.log(`❌ Business login error: ${error.message}`);
  }
  
  console.log('');
  
  // Test /api/auth/me endpoint
  try {
    console.log('Testing auth/me endpoint...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`);
    
    console.log(`Status: ${meResponse.status}`);
    
    if (meResponse.ok) {
      const data = await meResponse.json();
      console.log('✅ Auth/me endpoint working');
      console.log(`Authenticated: ${data.isAuthenticated}`);
      console.log(`Business: ${data.business?.name}`);
    } else {
      const errorText = await meResponse.text();
      console.log('❌ Auth/me failed');
      console.log(`Error: ${errorText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.log(`❌ Auth/me error: ${error.message}`);
  }
  
  console.log('\n=== LOGIN TEST COMPLETE ===');
}

testLoginEndpoints();