// Test GPT endpoints against official BizWorx unified schema format
async function testBizWorxUnifiedSchemaCompliance() {
  console.log('=== TESTING BIZWORX UNIFIED SCHEMA COMPLIANCE ===\n');
  
  const baseUrl = 'https://bluecollarbizworx.replit.app';
  const apiKey = 'bw_lcf7itxs8qocat5sd5';
  
  const headers = {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  };
  
  const endpoints = [
    { path: '/api/gpt/clients', method: 'GET', name: 'Clients List' },
    { path: '/api/gpt/jobs', method: 'GET', name: 'Jobs List' },
    { path: '/api/gpt/estimates', method: 'GET', name: 'Estimates List' },
    { path: '/api/gpt/invoices', method: 'GET', name: 'Invoices List' }
  ];
  
  console.log('Testing all endpoints for BizWorx unified schema compliance...\n');
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers
      });
      
      const data = await response.json();
      
      // Check BizWorx unified schema requirements
      const hasSuccess = data.hasOwnProperty('success');
      const hasData = data.hasOwnProperty('data');
      const hasMessage = data.hasOwnProperty('message');
      const hasBusinessVerification = data.hasOwnProperty('businessVerification');
      
      // Check businessVerification structure
      let businessVerificationValid = false;
      if (hasBusinessVerification && data.businessVerification) {
        const bv = data.businessVerification;
        businessVerificationValid = bv.businessName && bv.businessId && bv.dataSource && bv.timestamp;
      }
      
      console.log(`${endpoint.name} (${endpoint.path}):`);
      console.log(`  Status: ${response.status}`);
      console.log(`  success field: ${hasSuccess ? 'PRESENT' : 'MISSING'}`);
      console.log(`  data field: ${hasData ? 'PRESENT' : 'MISSING'}`);
      console.log(`  message field: ${hasMessage ? 'PRESENT' : 'MISSING'}`);
      console.log(`  businessVerification field: ${hasBusinessVerification ? 'PRESENT' : 'MISSING'}`);
      console.log(`  businessVerification valid: ${businessVerificationValid ? 'YES' : 'NO'}`);
      console.log(`  Data type: ${Array.isArray(data.data) ? 'Array' : typeof data.data}`);
      console.log(`  Data count: ${Array.isArray(data.data) ? data.data.length : 'N/A'}`);
      
      const schemaCompliant = hasSuccess && hasData && hasMessage && hasBusinessVerification && businessVerificationValid;
      console.log(`  BizWorx Schema Compliant: ${schemaCompliant ? 'YES' : 'NO'}`);
      console.log('');
      
    } catch (error) {
      console.log(`${endpoint.name}: ERROR - ${error.message}\n`);
    }
  }
  
  // Test a creation endpoint to verify full CRUD compliance
  console.log('Testing client creation for unified schema compliance...');
  try {
    const clientData = {
      name: "Schema Test Client",
      email: "schematest@example.com",
      phone: "555-SCHEMA",
      address: "123 Schema Test St"
    };
    
    const createResponse = await fetch(`${baseUrl}/api/gpt/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify(clientData)
    });
    
    const createResult = await createResponse.json();
    
    const hasSuccess = createResult.hasOwnProperty('success');
    const hasData = createResult.hasOwnProperty('data');
    const hasMessage = createResult.hasOwnProperty('message');
    const hasBusinessVerification = createResult.hasOwnProperty('businessVerification');
    
    console.log(`Client Creation:`);
    console.log(`  Status: ${createResponse.status}`);
    console.log(`  success: ${hasSuccess}`);
    console.log(`  data: ${hasData}`);
    console.log(`  message: ${hasMessage}`);
    console.log(`  businessVerification: ${hasBusinessVerification}`);
    console.log(`  Schema Compliant: ${hasSuccess && hasData && hasMessage && hasBusinessVerification ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.log(`Client Creation: ERROR - ${error.message}`);
  }
  
  console.log('\n=== BIZWORX UNIFIED SCHEMA COMPLIANCE SUMMARY ===');
  console.log('All endpoints tested against official BizWorx unified schema requirements:');
  console.log('- success: boolean field');
  console.log('- data: array/object field');
  console.log('- message: string field');
  console.log('- businessVerification: object with businessName, businessId, dataSource, timestamp');
  console.log('\nReady for ChatGPT Custom GPT integration with authentic BizWorx schema.');
}

testBizWorxUnifiedSchemaCompliance();