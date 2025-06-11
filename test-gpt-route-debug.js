import https from 'https';

async function testGPTEstimatesDetailed() {
  console.log('=== Testing GPT Estimates Route in Detail ===');
  
  const options = {
    hostname: 'bluecollarbizworx.replit.app',
    port: 443,
    path: '/api/gpt/estimates',
    method: 'GET',
    headers: {
      'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
      'Content-Type': 'application/json'
    }
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
  console.log(`Full Response:`, JSON.stringify(result.data, null, 2));
  
  if (result.data && result.data.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
    console.log('\n=== First Estimate Analysis ===');
    const firstEstimate = result.data.data[0];
    console.log('All fields present:', Object.keys(firstEstimate));
    console.log('Has items field:', 'items' in firstEstimate);
    console.log('Has clientName field:', 'clientName' in firstEstimate);
    console.log('Has description field:', 'description' in firstEstimate);
    console.log('Has businessId field:', 'businessId' in firstEstimate);
    console.log('Has subtotal field:', 'subtotal' in firstEstimate);
    console.log('Has tax field:', 'tax' in firstEstimate);
    
    if ('items' in firstEstimate) {
      console.log('Items array:', JSON.stringify(firstEstimate.items, null, 2));
    }
  }
  
  console.log('\n=== Message Analysis ===');
  console.log('Message:', result.data.message);
  console.log('Business verification present:', 'businessVerification' in result.data);
  
  if (result.data.businessVerification) {
    console.log('Business name in verification:', result.data.businessVerification.businessName);
  }
}

testGPTEstimatesDetailed();