// Validate current API responses against the complete schema
async function validateSchemaCompliance() {
  console.log('=== VALIDATING SCHEMA COMPLIANCE ===\n');
  
  const testApiKey = 'bw_ex0i7udnrrumbzikdnd';
  const baseUrl = 'https://bizworx-7faf4.web.app/api/gpt';
  
  const endpoints = [
    { path: '/clients', method: 'GET', name: 'Get Clients' },
    { path: '/estimates', method: 'GET', name: 'Get Estimates' },
    { path: '/invoices', method: 'GET', name: 'Get Invoices' },
    { path: '/jobs', method: 'GET', name: 'Get Jobs' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n--- Testing ${endpoint.name} ---`);
    
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'X-API-Key': testApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Validate required response structure
        console.log('✓ Response Structure:');
        console.log(`  - success: ${typeof data.success} (${data.success})`);
        console.log(`  - data: ${Array.isArray(data.data) ? 'array' : typeof data.data} (${data.data?.length || 0} items)`);
        console.log(`  - message: ${typeof data.message} ("${data.message}")`);
        console.log(`  - businessVerification: ${typeof data.businessVerification}`);
        
        if (data.businessVerification) {
          console.log('  BusinessVerification fields:');
          console.log(`    - businessName: ${data.businessVerification.businessName}`);
          console.log(`    - businessId: ${data.businessVerification.businessId}`);
          console.log(`    - dataSource: ${data.businessVerification.dataSource}`);
          console.log(`    - timestamp: ${data.businessVerification.timestamp}`);
        }
        
        // Sample first item if exists
        if (data.data && data.data.length > 0) {
          console.log('  First item fields:');
          const item = data.data[0];
          Object.keys(item).forEach(key => {
            console.log(`    - ${key}: ${typeof item[key]} (${item[key]})`);
          });
        }
        
      } else {
        const errorText = await response.text();
        console.log(`✗ Error: ${errorText}`);
      }
      
    } catch (error) {
      console.log(`✗ Request failed: ${error.message}`);
    }
  }
}

validateSchemaCompliance();