const https = require('https');

async function testEndpoint(url, headers, description) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname,
      method: 'GET',
      headers
    };

    console.log(`\n=== Testing ${description} ===`);
    console.log('URL:', url);
    console.log('Headers:', JSON.stringify(headers, null, 2));

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('Status:', res.statusCode);
          console.log('Response type:', typeof parsed);
          console.log('Has success field:', 'success' in parsed);
          console.log('Has data field:', 'data' in parsed);
          
          if (parsed.data && Array.isArray(parsed.data)) {
            console.log('Data array length:', parsed.data.length);
            if (parsed.data.length > 0) {
              const firstItem = parsed.data[0];
              console.log('First item fields:', Object.keys(firstItem));
              console.log('Has items field:', 'items' in firstItem);
              console.log('Has clientName field:', 'clientName' in firstItem);
              
              if (firstItem.items && Array.isArray(firstItem.items)) {
                console.log('Items array length:', firstItem.items.length);
                if (firstItem.items.length > 0) {
                  console.log('First item structure:', Object.keys(firstItem.items[0]));
                }
              }
            }
          }
          
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          console.log('JSON parse error:', e.message);
          console.log('Raw response:', data);
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function runTests() {
  const apiKey = 'bw_wkad606ephtmbqx7a0f';
  const baseUrl = 'https://bluecollarbizworx.replit.app';
  
  try {
    // Test external estimates endpoint
    await testEndpoint(
      `${baseUrl}/api/external/estimates`,
      {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      'External Estimates Endpoint'
    );

    // Test GPT estimates endpoint
    await testEndpoint(
      `${baseUrl}/api/gpt/estimates`,
      {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      'GPT Estimates Endpoint'
    );

    console.log('\n=== Test Complete ===');
    
  } catch (error) {
    console.error('Test suite failed:', error.message);
  }
}

runTests();