import https from 'https';

function testDeployment() {
  console.log('Testing redeployed BizWorx application...\n');
  
  // Test root endpoint first
  const rootReq = https.get('https://bizworx-complete-business-management-api.replit.app/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log(`Root endpoint: ${res.statusCode}`);
      if (res.statusCode === 200) {
        console.log('✅ Server is accessible');
        testHealth();
      } else {
        console.log('❌ Server not accessible');
      }
    });
  });
  
  function testHealth() {
    const healthReq = https.get('https://bizworx-complete-business-management-api.replit.app/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Health check: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('✅ Health endpoint working');
          testLogin();
        } else {
          console.log('❌ Health endpoint not found');
          testLogin(); // Continue anyway
        }
      });
    });
  }
  
  function testLogin() {
    const postData = JSON.stringify({
      email: 'demo@bizworx.com',
      password: 'demo123'
    });

    const options = {
      hostname: 'bizworx-complete-business-management-api.replit.app',
      port: 443,
      path: '/api/business/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Login: ${res.statusCode}`);
        if (res.statusCode === 200) {
          console.log('✅ Login working');
          const cookies = res.headers['set-cookie'];
          testApiKey(cookies);
        } else {
          console.log('❌ Login failed');
        }
      });
    });
    req.write(postData);
    req.end();
  }
  
  function testApiKey(cookies) {
    const options = {
      hostname: 'bizworx-complete-business-management-api.replit.app',
      port: 443,
      path: '/api/business/api-key',
      method: 'POST',
      headers: {
        'Cookie': cookies ? cookies.join('; ') : ''
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`API Key generation: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.data && parsed.data.apiKey) {
              console.log('✅ API key generated');
              testGPT(parsed.data.apiKey);
            } else {
              console.log('❌ No API key returned');
            }
          } catch (e) {
            console.log('❌ Invalid response format');
          }
        } else {
          console.log('❌ API key generation failed');
        }
      });
    });
    req.end();
  }
  
  function testGPT(apiKey) {
    const options = {
      hostname: 'bizworx-complete-business-management-api.replit.app',
      port: 443,
      path: '/gpt/clients',
      method: 'GET',
      headers: {
        'X-API-Key': apiKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`GPT endpoint: ${res.statusCode}`);
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.success) {
              console.log('✅ GPT endpoint working');
              console.log(`   Returned ${parsed.data.length} clients`);
            } else {
              console.log('❌ Unexpected GPT response format');
            }
          } catch (e) {
            console.log('❌ GPT endpoint returned HTML instead of JSON');
          }
        } else {
          console.log('❌ GPT endpoint failed');
        }
        
        console.log('\n=== DEPLOYMENT TEST COMPLETE ===');
      });
    });
    req.end();
  }
}

testDeployment();