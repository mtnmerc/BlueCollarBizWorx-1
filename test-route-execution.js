import https from 'https';

async function testRouteExecution() {
  // Test multiple endpoints to see which ones are working
  const tests = [
    {
      name: 'GPT Test Endpoint',
      path: '/api/gpt/test',
      expectConsoleLog: false
    },
    {
      name: 'GPT Estimates Endpoint',
      path: '/api/gpt/estimates', 
      expectConsoleLog: true
    },
    {
      name: 'External Estimates Endpoint',
      path: '/api/external/estimates',
      expectConsoleLog: false
    }
  ];

  for (const test of tests) {
    console.log(`\n=== Testing ${test.name} ===`);
    
    const result = await makeRequest(test.path);
    
    console.log(`Status: ${result.status}`);
    console.log(`Response type: ${typeof result.data}`);
    
    if (result.data && typeof result.data === 'object') {
      console.log(`Response structure:`);
      console.log(`- Has success: ${'success' in result.data}`);
      console.log(`- Has data: ${'data' in result.data}`);
      console.log(`- Has businessVerification: ${'businessVerification' in result.data}`);
      
      if (result.data.data && Array.isArray(result.data.data)) {
        console.log(`- Data length: ${result.data.data.length}`);
        if (result.data.data.length > 0) {
          console.log(`- First item keys: ${Object.keys(result.data.data[0]).join(', ')}`);
        }
      }
      
      if (result.data.message) {
        console.log(`- Message: ${result.data.message}`);
      }
    }
  }
}

function makeRequest(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ status: 0, data: { error: error.message } });
    });

    req.end();
  });
}

testRouteExecution();