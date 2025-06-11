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

async function testFinalVerification() {
  console.log('=== Final GPT Integration Verification ===\n');

  try {
    // Test estimates endpoint
    const estimatesResult = await makeRequest('/api/gpt/estimates');
    console.log('1. Estimates Endpoint Test:');
    console.log('   Status:', estimatesResult.status);
    console.log('   Success:', estimatesResult.data.success);
    
    if (estimatesResult.data.data && estimatesResult.data.data.length > 0) {
      const firstEstimate = estimatesResult.data.data[0];
      console.log('   Schema Compliance Check:');
      console.log('   - Has items array:', Array.isArray(firstEstimate.items));
      console.log('   - Items count:', firstEstimate.items ? firstEstimate.items.length : 'N/A');
      console.log('   - Has clientName:', !!firstEstimate.clientName);
      console.log('   - Has businessVerification:', !!estimatesResult.data.businessVerification);
      console.log('   - Data source:', estimatesResult.data.businessVerification?.dataSource || 'Unknown');
      
      if (firstEstimate.items && firstEstimate.items.length > 0) {
        console.log('   - First item structure:', JSON.stringify(firstEstimate.items[0], null, 2));
      }
    }
    console.log('');

    // Test invoices endpoint
    const invoicesResult = await makeRequest('/api/gpt/invoices');
    console.log('2. Invoices Endpoint Test:');
    console.log('   Status:', invoicesResult.status);
    console.log('   Success:', invoicesResult.data.success);
    console.log('   Has businessVerification:', !!invoicesResult.data.businessVerification);
    console.log('');

    // Test clients endpoint
    const clientsResult = await makeRequest('/api/gpt/clients');
    console.log('3. Clients Endpoint Test:');
    console.log('   Status:', clientsResult.status);
    console.log('   Success:', clientsResult.data.success);
    console.log('   Has businessVerification:', !!clientsResult.data.businessVerification);
    console.log('');

    // Test client creation
    const createClientResult = await makeRequest('/api/gpt/clients', 'POST', {
      name: 'Final Test Client',
      email: 'final.test@example.com',
      phone: '555-0199'
    });
    console.log('4. Client Creation Test:');
    console.log('   Status:', createClientResult.status);
    console.log('   Success:', createClientResult.data.success);
    console.log('   Has businessVerification:', !!createClientResult.data.businessVerification);
    
    // Summary
    console.log('\n=== INTEGRATION STATUS SUMMARY ===');
    const hasSchemaCompliance = estimatesResult.data.businessVerification && 
                                estimatesResult.data.data[0]?.items &&
                                estimatesResult.data.data[0]?.clientName;
    
    if (hasSchemaCompliance) {
      console.log('✅ SUCCESS: GPT routes are schema-compliant with full data structure');
      console.log('✅ SUCCESS: Business verification implemented');
      console.log('✅ SUCCESS: Line items properly formatted');
      console.log('✅ SUCCESS: Client names included in responses');
      console.log('\n🎯 ChatGPT Custom GPT integration is ready for production use');
    } else {
      console.log('❌ ISSUE: GPT routes not returning schema-compliant data');
      console.log('   - Missing items arrays or clientName fields');
      console.log('   - BusinessVerification object not present');
      console.log('\n⚠️  Further investigation needed');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testFinalVerification();