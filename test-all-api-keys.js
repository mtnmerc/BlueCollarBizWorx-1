// Test all API keys to verify business isolation
async function testAllApiKeys() {
  console.log('=== TESTING ALL API KEYS FOR BUSINESS ISOLATION ===\n');
  
  const apiKeys = [
    { key: 'bw_ex0i7udnrrumbzikdnd', expected: 'Flatline earthworks', id: 1 },
    { key: 'bw_lcf7itxs8qocat5sd5', expected: 'Fixed Login Business', id: 16 },
    { key: 'bw_y09k0oyq06t9peo4pd', expected: 'Test Business 2', id: 35 },
    { key: 'bw_xh7raq1cj7m6gosjjj7', expected: 'Test Business', id: 27 },
    { key: 'bw_ci4dubx6ziu75th9sto', expected: 'Flatline Earthworks', id: 36 }
  ];
  
  for (const test of apiKeys) {
    console.log(`\n--- API Key: ${test.key} ---`);
    console.log(`Expected: "${test.expected}" (ID: ${test.id})`);
    
    try {
      const response = await fetch('https://bluecollarbizworx.replit.app/api/gpt/clients', {
        headers: { 'X-API-Key': test.key }
      });
      
      if (response.ok) {
        const data = await response.json();
        const returnedBusiness = data.businessVerification?.businessName;
        const returnedId = data.businessVerification?.businessId;
        
        console.log(`Returned: "${returnedBusiness}" (ID: ${returnedId})`);
        console.log(`Clients: ${data.data?.length || 0}`);
        
        if (returnedBusiness === test.expected && returnedId === test.id) {
          console.log('✓ CORRECT - Proper isolation');
        } else {
          console.log('🚨 WRONG - Isolation failure!');
          console.log(`  Expected: "${test.expected}" (ID: ${test.id})`);
          console.log(`  Got: "${returnedBusiness}" (ID: ${returnedId})`);
        }
        
      } else {
        console.log(`✗ HTTP ${response.status}: ${await response.text()}`);
      }
      
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
  }
  
  console.log('\n=== ISOLATION SUMMARY ===');
  console.log('Each API key should return data ONLY for its associated business.');
  console.log('Any key returning "Flatline earthworks" data when it should return');
  console.log('a different business indicates a critical isolation failure.');
}

testAllApiKeys();