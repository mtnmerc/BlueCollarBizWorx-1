const https = require('https');

async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ChatGPT-Test/1.0'
      }
    };

    if (data && method !== 'GET') {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

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

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing ChatGPT GPT endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing /health endpoint...');
    const health = await testEndpoint('/health');
    console.log(`Status: ${health.status}`);
    console.log(`Response:`, health.data);
    console.log('');

    // Test GPT clients endpoint
    console.log('2. Testing /gpt/clients endpoint...');
    const clients = await testEndpoint('/gpt/clients');
    console.log(`Status: ${clients.status}`);
    console.log(`Response:`, JSON.stringify(clients.data, null, 2));
    console.log('');

    // Test GPT jobs endpoint
    console.log('3. Testing /gpt/jobs endpoint...');
    const jobs = await testEndpoint('/gpt/jobs');
    console.log(`Status: ${jobs.status}`);
    console.log(`Response:`, JSON.stringify(jobs.data, null, 2));
    console.log('');

    // Test GPT revenue endpoint
    console.log('4. Testing /gpt/revenue endpoint...');
    const revenue = await testEndpoint('/gpt/revenue');
    console.log(`Status: ${revenue.status}`);
    console.log(`Response:`, JSON.stringify(revenue.data, null, 2));
    console.log('');

    console.log('All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

runTests();