import https from 'https';

async function testEndpoint(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing BizWorx ChatGPT endpoints...\n');

  // Test health endpoint
  try {
    const healthResponse = await testEndpoint('/health');
    console.log('Health check:', healthResponse.status, healthResponse.body);
  } catch (error) {
    console.log('Health check failed:', error.message);
  }

  // Test ChatGPT endpoints without API key (should get 401)
  try {
    const clientsResponse = await testEndpoint('/gpt/clients');
    console.log('Clients without API key:', clientsResponse.status, clientsResponse.body);
  } catch (error) {
    console.log('Clients test failed:', error.message);
  }

  // Test with dummy API key
  try {
    const clientsWithKeyResponse = await testEndpoint('/gpt/clients', 'GET', {
      'X-API-Key': 'test-key-123'
    });
    console.log('Clients with dummy API key:', clientsWithKeyResponse.status, clientsWithKeyResponse.body);
  } catch (error) {
    console.log('Clients with key test failed:', error.message);
  }

  console.log('\nTest complete. If health check passes but ChatGPT endpoints fail,');
  console.log('you need to generate a valid API key from your business settings.');
}

runTests();