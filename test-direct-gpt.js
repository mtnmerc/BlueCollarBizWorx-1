const https = require('https');

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Test',
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
          statusCode: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function testDirectGPTRoutes() {
  console.log('=== Testing Direct GPT Routes ===\n');

  try {
    // Test estimates endpoint
    console.log('1. Testing /api/gpt/estimates...');
    const estimatesResult = await makeRequest('/api/gpt/estimates', {
      'X-API-Key': 'bw_wkad606ephtmbqx7a0f'
    });
    
    console.log('Status:', estimatesResult.statusCode);
    
    if (estimatesResult.statusCode === 200) {
      try {
        const estimatesData = JSON.parse(estimatesResult.data);
        console.log('Success:', estimatesData.success);
        console.log('Has businessVerification:', !!estimatesData.businessVerification);
        
        if (estimatesData.data && estimatesData.data.length > 0) {
          const firstEstimate = estimatesData.data[0];
          console.log('Has items array:', Array.isArray(firstEstimate.items));
          console.log('Items count:', firstEstimate.items ? firstEstimate.items.length : 'N/A');
          console.log('Has clientName:', !!firstEstimate.clientName);
          console.log('Data source:', estimatesData.businessVerification?.dataSource || 'Unknown');
        }
      } catch (e) {
        console.log('Failed to parse estimates response');
      }
    }
    
    console.log('\n2. Testing /api/gpt/clients...');
    const clientsResult = await makeRequest('/api/gpt/clients', {
      'X-API-Key': 'bw_wkad606ephtmbqx7a0f'
    });
    
    console.log('Status:', clientsResult.statusCode);
    
    if (clientsResult.statusCode === 200) {
      try {
        const clientsData = JSON.parse(clientsResult.data);
        console.log('Success:', clientsData.success);
        console.log('Has businessVerification:', !!clientsData.businessVerification);
        console.log('Data source:', clientsData.businessVerification?.dataSource || 'Unknown');
      } catch (e) {
        console.log('Failed to parse clients response');
      }
    }

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testDirectGPTRoutes();