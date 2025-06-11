import https from 'https';

function makeRequest(hostname, port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: hostname,
      port: port,
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

async function testIsolatedGPTServer() {
  console.log('=== Testing Isolated GPT Server (Port 3001) ===\n');

  try {
    // Test estimates endpoint on isolated server
    console.log('1. Testing isolated /api/gpt/estimates...');
    const estimatesResult = await makeRequest('localhost', 3001, '/api/gpt/estimates', {
      'X-API-Key': 'bw_wkad606ephtmbqx7a0f'
    });
    
    console.log('Status:', estimatesResult.statusCode);
    
    if (estimatesResult.statusCode === 200) {
      try {
        const estimatesData = JSON.parse(estimatesResult.data);
        console.log('SUCCESS - Schema Compliance Check:');
        console.log('- Response success:', estimatesData.success);
        console.log('- Has businessVerification:', !!estimatesData.businessVerification);
        console.log('- Data source:', estimatesData.businessVerification?.dataSource || 'Unknown');
        
        if (estimatesData.data && estimatesData.data.length > 0) {
          const firstEstimate = estimatesData.data[0];
          console.log('- Has items array:', Array.isArray(firstEstimate.items));
          console.log('- Items count:', firstEstimate.items ? firstEstimate.items.length : 'N/A');
          console.log('- Has clientName:', !!firstEstimate.clientName);
          console.log('- Sample item structure:', firstEstimate.items?.[0] || 'No items');
        }
      } catch (e) {
        console.log('Failed to parse estimates response:', e.message);
      }
    }
    
    console.log('\n2. Testing isolated /api/gpt/clients...');
    const clientsResult = await makeRequest('localhost', 3001, '/api/gpt/clients', {
      'X-API-Key': 'bw_wkad606ephtmbqx7a0f'
    });
    
    console.log('Status:', clientsResult.statusCode);
    
    if (clientsResult.statusCode === 200) {
      try {
        const clientsData = JSON.parse(clientsResult.data);
        console.log('SUCCESS - Schema Compliance Check:');
        console.log('- Response success:', clientsData.success);
        console.log('- Has businessVerification:', !!clientsData.businessVerification);
        console.log('- Data source:', clientsData.businessVerification?.dataSource || 'Unknown');
        console.log('- Clients count:', clientsData.data?.length || 0);
      } catch (e) {
        console.log('Failed to parse clients response:', e.message);
      }
    }

    console.log('\n=== ISOLATED SERVER TEST SUMMARY ===');
    console.log('If businessVerification and items arrays are present, the isolated server works correctly.');

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testIsolatedGPTServer();