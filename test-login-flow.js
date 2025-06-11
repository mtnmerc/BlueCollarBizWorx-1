import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testLoginFlow() {
  console.log('=== TESTING LOGIN FLOW ===\n');
  
  try {
    // Test business login
    console.log('1. Testing business login...');
    const loginResponse = await fetch(`${BASE_URL}/api/auth/business/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alter3d24@gmail.com',
        password: 'password123'
      })
    });
    
    console.log(`Login response status: ${loginResponse.status}`);
    const loginText = await loginResponse.text();
    
    if (loginText.includes('<!DOCTYPE')) {
      console.log('❌ Login endpoint returning HTML - authentication routes not active');
      console.log('This means the server restart/redeploy did not activate auth routes');
    } else {
      console.log('✅ Login endpoint returning JSON');
      try {
        const loginData = JSON.parse(loginText);
        console.log('Login response:', JSON.stringify(loginData, null, 2));
      } catch (e) {
        console.log('Response not valid JSON:', loginText.substring(0, 200));
      }
    }
    
    // Test auth/me endpoint
    console.log('\n2. Testing auth/me endpoint...');
    const meResponse = await fetch(`${BASE_URL}/api/auth/me`);
    const meText = await meResponse.text();
    
    if (meText.includes('<!DOCTYPE')) {
      console.log('❌ Auth/me endpoint returning HTML - routes not active');
    } else {
      console.log('✅ Auth/me endpoint returning JSON');
      try {
        const meData = JSON.parse(meText);
        console.log('Auth/me response:', JSON.stringify(meData, null, 2));
      } catch (e) {
        console.log('Response not valid JSON:', meText.substring(0, 200));
      }
    }
    
    // Test PIN login endpoint
    console.log('\n3. Testing PIN login endpoint...');
    const pinResponse = await fetch(`${BASE_URL}/api/auth/pin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: '1234' })
    });
    
    console.log(`PIN login status: ${pinResponse.status}`);
    const pinText = await pinResponse.text();
    
    if (pinText.includes('<!DOCTYPE')) {
      console.log('❌ PIN login endpoint returning HTML - routes not active');
    } else {
      console.log('✅ PIN login endpoint returning JSON');
    }
    
  } catch (error) {
    console.log(`❌ Error testing login flow: ${error.message}`);
  }
  
  console.log('\n=== LOGIN FLOW TEST COMPLETE ===');
}

testLoginFlow();