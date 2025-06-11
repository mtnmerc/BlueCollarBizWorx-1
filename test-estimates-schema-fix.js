import https from 'https';

async function testEndpoint(url, headers, description) {
  console.log(`\n=== ${description} ===`);
  
  const options = {
    hostname: 'bluecollarbizworx.replit.app',
    port: 443,
    path: url,
    method: 'GET',
    headers: headers
  };

  const result = await new Promise((resolve) => {
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

  console.log(`Status: ${result.status}`);
  if (result.data && result.data.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
    const first = result.data.data[0];
    console.log(`Fields: ${Object.keys(first).join(', ')}`);
    console.log(`Has items: ${'items' in first}`);
    console.log(`Has clientName: ${'clientName' in first}`);
    console.log(`Has businessVerification: ${'businessVerification' in result.data}`);
  }
  console.log(`Message: "${result.data.message || 'No message'}"`);
  
  return result;
}

async function runTests() {
  const apiKey = 'bw_wkad606ephtmbqx7a0f';
  
  // Test different endpoints to understand routing
  await testEndpoint('/api/gpt/test', 
    { 'X-API-Key': apiKey }, 
    'GPT Test Endpoint');
    
  await testEndpoint('/api/external/estimates', 
    { 'X-API-Key': apiKey }, 
    'External Estimates (should be simple)');
    
  await testEndpoint('/api/gpt/estimates', 
    { 'X-API-Key': apiKey }, 
    'GPT Estimates (should be schema-compliant)');
    
  await testEndpoint('/api/gpt/clients', 
    { 'X-API-Key': apiKey }, 
    'GPT Clients (for comparison)');
}

runTests();