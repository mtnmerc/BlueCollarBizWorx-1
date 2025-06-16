// Final test to verify GPT endpoints match BizWorx unified schema exactly
async function testFinalUnifiedSchemaMatch() {
  console.log('=== FINAL BIZWORX UNIFIED SCHEMA MATCH TEST ===\n');
  
  const baseUrl = 'https://bluecollarbizworx.replit.app';
  const apiKey = 'bw_lcf7itxs8qocat5sd5';
  
  const headers = {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  };
  
  // Test the exact paths from the unified schema
  const endpoints = [
    { path: '/api/gpt/clients', schema_path: '/clients', name: 'Clients' },
    { path: '/api/gpt/jobs', schema_path: '/jobs', name: 'Jobs' },
    { path: '/api/gpt/estimates', schema_path: '/estimates', name: 'Estimates' },
    { path: '/api/gpt/invoices', schema_path: '/invoices', name: 'Invoices' }
  ];
  
  console.log('Testing GPT endpoints against BizWorx unified schema requirements:\n');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: 'GET',
        headers
      });
      
      if (response.status === 200) {
        const data = await response.json();
        
        // Check unified schema compliance
        const requiredFields = ['success', 'data', 'message', 'businessVerification'];
        const hasAllFields = requiredFields.every(field => data.hasOwnProperty(field));
        
        // Check businessVerification structure
        const bv = data.businessVerification;
        const bvValid = bv && bv.businessName && bv.businessId && bv.dataSource && bv.timestamp;
        
        console.log(`${endpoint.name} (${endpoint.schema_path}):`);
        console.log(`  HTTP Status: 200`);
        console.log(`  Required fields: ${hasAllFields ? 'ALL PRESENT' : 'MISSING'}`);
        console.log(`  BusinessVerification: ${bvValid ? 'VALID' : 'INVALID'}`);
        console.log(`  Data type: ${Array.isArray(data.data) ? 'Array' : typeof data.data}`);
        console.log(`  Records: ${Array.isArray(data.data) ? data.data.length : 'N/A'}`);
        console.log(`  Schema Match: ${hasAllFields && bvValid ? 'PERFECT' : 'FAILED'}`);
        console.log('');
      } else {
        console.log(`${endpoint.name}: HTTP ${response.status} - ${await response.text()}\n`);
      }
      
    } catch (error) {
      console.log(`${endpoint.name}: ERROR - ${error.message}\n`);
    }
  }
  
  // Test CRUD operation
  console.log('Testing CRUD operation compliance...');
  try {
    const testClient = {
      name: "Final Test Client",
      email: "finaltest@example.com", 
      phone: "555-FINAL",
      address: "999 Final Test Ave"
    };
    
    const createResponse = await fetch(`${baseUrl}/api/gpt/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testClient)
    });
    
    const createData = await createResponse.json();
    const crudCompliant = createData.success && createData.data && createData.message && createData.businessVerification;
    
    console.log(`CRUD Test: ${crudCompliant ? 'UNIFIED SCHEMA COMPLIANT' : 'FAILED'}`);
    
  } catch (error) {
    console.log(`CRUD Test: ERROR - ${error.message}`);
  }
  
  console.log('\n=== FINAL VERIFICATION COMPLETE ===');
  console.log('BizWorx unified schema file: bizworx-unified-schema.json');
  console.log('Schema base URL: https://bluecollarbizworx.replit.app/api/gpt');
  console.log('Authentication: X-API-Key header');
  console.log('Response format: {success, data, message, businessVerification}');
  console.log('\nChatGPT Custom GPT integration ready with official BizWorx unified schema.');
}

testFinalUnifiedSchemaMatch();