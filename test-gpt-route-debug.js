import https from 'https';

async function testGPTEstimatesDetailed() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: '/api/gpt/estimates',
      method: 'GET',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json',
        'User-Agent': 'BizWorx-ChatGPT-Test/1.0'
      }
    };

    console.log('=== Testing GPT Estimates Route ===');
    console.log('Request details:');
    console.log('- URL: https://bluecollarbizworx.replit.app/api/gpt/estimates');
    console.log('- Headers:', JSON.stringify(options.headers, null, 2));

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('\nResponse Analysis:');
          console.log('- Status Code:', res.statusCode);
          console.log('- Content-Type:', res.headers['content-type']);
          console.log('- Response Structure:');
          console.log('  * Has success field:', 'success' in parsed);
          console.log('  * Has data field:', 'data' in parsed);
          console.log('  * Has businessVerification field:', 'businessVerification' in parsed);
          
          if (parsed.data && Array.isArray(parsed.data)) {
            console.log('  * Data array length:', parsed.data.length);
            if (parsed.data.length > 0) {
              const firstItem = parsed.data[0];
              console.log('  * First item fields:', Object.keys(firstItem));
              console.log('  * Has items field:', 'items' in firstItem);
              console.log('  * Has clientName field:', 'clientName' in firstItem);
              console.log('  * Has description field:', 'description' in firstItem);
              
              if ('items' in firstItem && Array.isArray(firstItem.items)) {
                console.log('  * Items array length:', firstItem.items.length);
                if (firstItem.items.length > 0) {
                  console.log('  * First item structure:', Object.keys(firstItem.items[0]));
                }
              }
              
              // Show sample of the actual data returned
              console.log('\nSample Data (first estimate):');
              console.log(JSON.stringify(firstItem, null, 2));
            }
          }
          
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          console.log('JSON parse error:', e.message);
          console.log('Raw response (first 500 chars):', data.substring(0, 500));
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('Request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

// Run the test
testGPTEstimatesDetailed()
  .then(() => console.log('\n=== Test Completed ==='))
  .catch(error => console.error('Test failed:', error.message));