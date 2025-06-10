import https from 'https';

async function makeRequest(path, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=s%3A0123456789abcdef.test', // Mock session for testing
        ...headers
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

async function testApiKeyManagement() {
  console.log('Testing API Key Management...\n');

  try {
    // Test getting current API key
    console.log('1. Testing GET /api/business/api-key...');
    const getKey = await makeRequest('/api/business/api-key');
    console.log(`Status: ${getKey.status}`);
    console.log(`Response:`, JSON.stringify(getKey.data, null, 2));
    console.log('');

    // Test revoking API key
    console.log('2. Testing DELETE /api/business/api-key...');
    const revokeKey = await makeRequest('/api/business/api-key', 'DELETE');
    console.log(`Status: ${revokeKey.status}`);
    console.log(`Response:`, JSON.stringify(revokeKey.data, null, 2));
    console.log('');

    // Test generating new API key
    console.log('3. Testing POST /api/business/api-key...');
    const generateKey = await makeRequest('/api/business/api-key', 'POST');
    console.log(`Status: ${generateKey.status}`);
    console.log(`Response:`, JSON.stringify(generateKey.data, null, 2));
    console.log('');

    if (getKey.status === 401 || revokeKey.status === 401 || generateKey.status === 401) {
      console.log('❌ Session authentication is failing');
      console.log('This indicates the session businessId/userId is not properly set');
    } else {
      console.log('✅ API key management endpoints are accessible');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testApiKeyManagement();