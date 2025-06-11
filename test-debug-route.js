import https from 'https';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    console.log(`Making ${method} request to: ${path}`);

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testDebugRoute() {
  console.log('=== Debugging Route Execution ===\n');

  // Test the estimates endpoint
  const result = await makeRequest('/api/gpt/estimates');
  console.log('Response status:', result.status);
  console.log('Response data:');
  console.log(JSON.stringify(result.data, null, 2));
  
  // Check if we're hitting the correct route by looking for specific markers
  if (result.data.source) {
    console.log('\n❌ ISSUE: Hit external API route with source:', result.data.source);
  } else if (result.data.businessVerification) {
    console.log('\n✅ SUCCESS: Hit schema-compliant GPT route with businessVerification');
  } else {
    console.log('\n❓ UNCLEAR: Route source unknown');
  }
  
  // Check for debug fields
  if (result.data.data && result.data.data.length > 0) {
    const firstEstimate = result.data.data[0];
    console.log('\nFirst estimate structure:');
    console.log('- Has items array:', Array.isArray(firstEstimate.items));
    console.log('- Items count:', firstEstimate.items ? firstEstimate.items.length : 'N/A');
    console.log('- Has clientName:', !!firstEstimate.clientName);
    console.log('- Has estimateNumber:', !!firstEstimate.estimateNumber);
  }
}

testDebugRoute();