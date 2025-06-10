import https from 'https';

async function testGPTEndpoint(endpoint, apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GPT-Debug/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function debugGPTEndpoints() {
  const apiKey = 'bw_wkad606ephtmbqx7a0f';
  
  console.log('=== GPT Endpoints Debug ===\n');
  
  // Test dashboard first (known working)
  console.log('Testing /gpt/dashboard/stats...');
  try {
    const dashboardResult = await testGPTEndpoint('/gpt/dashboard/stats', apiKey);
    console.log(`Status: ${dashboardResult.status}`);
    console.log('Response:', JSON.stringify(dashboardResult.data, null, 2));
    console.log('✅ Dashboard working\n');
  } catch (error) {
    console.log('❌ Dashboard error:', error.message);
  }

  // Test clients endpoint
  console.log('Testing /gpt/clients...');
  try {
    const clientsResult = await testGPTEndpoint('/gpt/clients', apiKey);
    console.log(`Status: ${clientsResult.status}`);
    console.log('Response:', JSON.stringify(clientsResult.data, null, 2));
    
    if (clientsResult.status === 200 && clientsResult.data.success) {
      console.log('✅ Clients working');
    } else {
      console.log('❌ Clients failing');
    }
  } catch (error) {
    console.log('❌ Clients error:', error.message);
  }
  
  console.log('\nTesting /gpt/jobs...');
  try {
    const jobsResult = await testGPTEndpoint('/gpt/jobs', apiKey);
    console.log(`Status: ${jobsResult.status}`);
    console.log('Response:', JSON.stringify(jobsResult.data, null, 2));
    
    if (jobsResult.status === 200 && jobsResult.data.success) {
      console.log('✅ Jobs working');
    } else {
      console.log('❌ Jobs failing');
    }
  } catch (error) {
    console.log('❌ Jobs error:', error.message);
  }
}

debugGPTEndpoints().catch(console.error);