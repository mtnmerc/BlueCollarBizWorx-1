import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testAuthRestoration() {
  console.log('=== TESTING AUTHENTICATION RESTORATION ===\n');
  
  // Test if auth endpoints now return JSON instead of HTML
  try {
    console.log('Testing auth/me endpoint...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`);
    const responseText = await meResponse.text();
    
    if (responseText.includes('<!DOCTYPE')) {
      console.log('❌ Auth endpoints still returning HTML - routes not active');
    } else {
      console.log('✅ Auth endpoints returning JSON - routes active');
      try {
        const data = JSON.parse(responseText);
        console.log(`Auth status: ${data.isAuthenticated ? 'authenticated' : 'not authenticated'}`);
        console.log(`Business: ${data.business?.name || 'none'}`);
      } catch (e) {
        console.log('Auth endpoint responding but JSON parse failed');
      }
    }
    
  } catch (error) {
    console.log(`❌ Auth endpoint test error: ${error.message}`);
  }
  
  // Test business login endpoint
  try {
    console.log('\nTesting business login endpoint...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/business/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alter3d24@gmail.com',
        password: 'password123'
      })
    });
    
    console.log(`Login endpoint status: ${loginResponse.status}`);
    const loginText = await loginResponse.text();
    
    if (loginText.includes('<!DOCTYPE')) {
      console.log('❌ Login endpoint still returning HTML');
    } else {
      console.log('✅ Login endpoint returning JSON');
      try {
        const data = JSON.parse(loginText);
        console.log(`Login success: ${data.success}`);
        if (data.business) {
          console.log(`Business authenticated: ${data.business.name}`);
          console.log(`User included: ${data.user ? 'Yes' : 'No'}`);
        }
      } catch (e) {
        console.log('Login response JSON parse failed');
      }
    }
    
  } catch (error) {
    console.log(`❌ Login test error: ${error.message}`);
  }
  
  // Verify ChatGPT integration still works
  try {
    console.log('\nVerifying ChatGPT integration preserved...');
    const gptResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      headers: { 'X-API-Key': 'bw_wkad606ephtmbqx7a0f' }
    });
    
    if (gptResponse.ok) {
      const data = await gptResponse.json();
      console.log('✅ ChatGPT integration preserved');
      console.log(`Clients available: ${data.data?.length || 0}`);
    } else {
      console.log('❌ ChatGPT integration may be affected');
    }
    
  } catch (error) {
    console.log(`❌ ChatGPT verification error: ${error.message}`);
  }
  
  console.log('\n=== AUTHENTICATION RESTORATION TEST COMPLETE ===');
}

testAuthRestoration();