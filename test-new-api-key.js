import https from 'https';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    req.end();
  });
}

async function testNewApiKey() {
  console.log('Testing new API key:', API_KEY);
  console.log('');

  const endpoints = [
    '/gpt/clients',
    '/gpt/jobs',
    '/gpt/dashboard/stats'
  ];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    try {
      const result = await testEndpoint(endpoint);
      console.log(`Status: ${result.status}`);
      if (result.status === 200) {
        console.log('✅ Authentication successful');
      } else {
        console.log('❌ Authentication failed');
        console.log('Response:', JSON.stringify(result.data, null, 2));
      }
    } catch (error) {
      console.log('❌ Request failed:', error.message);
    }
    console.log('');
  }
}

testNewApiKey();