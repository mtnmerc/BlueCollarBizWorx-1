import https from 'https';

function makeRequest(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Node.js Test',
        'Content-Type': 'application/json',
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

async function testGPTSchemaCompliance() {
  console.log('=== COMPREHENSIVE GPT SCHEMA VERIFICATION ===\n');

  const apiKey = 'bw_wkad606ephtmbqx7a0f';
  const headers = { 'X-API-Key': apiKey };

  try {
    // Test 1: GPT Estimates Schema Compliance
    console.log('1. Testing GPT Estimates Schema Compliance...');
    const estimatesResult = await makeRequest('/api/gpt/estimates', headers);
    
    console.log('   Status Code:', estimatesResult.statusCode);
    
    if (estimatesResult.statusCode === 200) {
      try {
        const estimatesData = JSON.parse(estimatesResult.data);
        
        console.log('   ✓ Response Success:', estimatesData.success);
        console.log('   ✓ Business Verification Present:', !!estimatesData.businessVerification);
        console.log('   ✓ Data Source:', estimatesData.businessVerification?.dataSource || 'MISSING');
        console.log('   ✓ Business Name:', estimatesData.businessVerification?.businessName || 'MISSING');
        
        if (estimatesData.data && estimatesData.data.length > 0) {
          const firstEstimate = estimatesData.data[0];
          console.log('   ✓ Items Array Present:', Array.isArray(firstEstimate.items));
          console.log('   ✓ Items Count:', firstEstimate.items ? firstEstimate.items.length : 0);
          console.log('   ✓ Client Name Present:', !!firstEstimate.clientName);
          console.log('   ✓ Sample Item:', firstEstimate.items?.[0] || 'No items');
          
          // Schema compliance check
          const hasRequiredFields = !!(
            firstEstimate.items && 
            Array.isArray(firstEstimate.items) &&
            firstEstimate.clientName &&
            estimatesData.businessVerification &&
            estimatesData.businessVerification.dataSource === 'AUTHENTIC_DATABASE'
          );
          
          console.log('   ✓ SCHEMA COMPLIANT:', hasRequiredFields ? 'YES' : 'NO');
        } else {
          console.log('   ⚠ No estimates data found');
        }
      } catch (e) {
        console.log('   ✗ Failed to parse estimates response:', e.message);
      }
    } else {
      console.log('   ✗ Failed with status:', estimatesResult.statusCode);
    }

    console.log('\n2. Testing GPT Clients Schema Compliance...');
    const clientsResult = await makeRequest('/api/gpt/clients', headers);
    
    console.log('   Status Code:', clientsResult.statusCode);
    
    if (clientsResult.statusCode === 200) {
      try {
        const clientsData = JSON.parse(clientsResult.data);
        
        console.log('   ✓ Response Success:', clientsData.success);
        console.log('   ✓ Business Verification Present:', !!clientsData.businessVerification);
        console.log('   ✓ Data Source:', clientsData.businessVerification?.dataSource || 'MISSING');
        console.log('   ✓ Clients Count:', clientsData.data?.length || 0);
        
        const hasRequiredFields = !!(
          clientsData.businessVerification &&
          clientsData.businessVerification.dataSource === 'AUTHENTIC_DATABASE' &&
          Array.isArray(clientsData.data)
        );
        
        console.log('   ✓ SCHEMA COMPLIANT:', hasRequiredFields ? 'YES' : 'NO');
      } catch (e) {
        console.log('   ✗ Failed to parse clients response:', e.message);
      }
    } else {
      console.log('   ✗ Failed with status:', clientsResult.statusCode);
    }

    console.log('\n3. Testing GPT Invoices Schema Compliance...');
    const invoicesResult = await makeRequest('/api/gpt/invoices', headers);
    
    console.log('   Status Code:', invoicesResult.statusCode);
    
    if (invoicesResult.statusCode === 200) {
      try {
        const invoicesData = JSON.parse(invoicesResult.data);
        
        console.log('   ✓ Response Success:', invoicesData.success);
        console.log('   ✓ Business Verification Present:', !!invoicesData.businessVerification);
        console.log('   ✓ Data Source:', invoicesData.businessVerification?.dataSource || 'MISSING');
        
        if (invoicesData.data && invoicesData.data.length > 0) {
          const firstInvoice = invoicesData.data[0];
          console.log('   ✓ Items Array Present:', Array.isArray(firstInvoice.items));
          console.log('   ✓ Items Count:', firstInvoice.items ? firstInvoice.items.length : 0);
          console.log('   ✓ Client Name Present:', !!firstInvoice.clientName);
          
          const hasRequiredFields = !!(
            firstInvoice.items && 
            Array.isArray(firstInvoice.items) &&
            firstInvoice.clientName &&
            invoicesData.businessVerification &&
            invoicesData.businessVerification.dataSource === 'AUTHENTIC_DATABASE'
          );
          
          console.log('   ✓ SCHEMA COMPLIANT:', hasRequiredFields ? 'YES' : 'NO');
        } else {
          console.log('   ⚠ No invoices data found');
        }
      } catch (e) {
        console.log('   ✗ Failed to parse invoices response:', e.message);
      }
    } else {
      console.log('   ✗ Failed with status:', invoicesResult.statusCode);
    }

    console.log('\n=== FINAL SCHEMA VERIFICATION SUMMARY ===');
    console.log('If all endpoints show "SCHEMA COMPLIANT: YES", the ChatGPT Custom GPT integration is ready.');
    console.log('The 4 schema files can be imported into ChatGPT Custom GPT configuration.');
    console.log('API Key for testing: ' + apiKey);

  } catch (error) {
    console.error('Schema verification error:', error.message);
  }
}

testGPTSchemaCompliance();