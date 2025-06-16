// Emergency debug for business isolation failure
async function emergencyBusinessIsolationDebug() {
  console.log('=== EMERGENCY BUSINESS ISOLATION DEBUG ===\n');
  
  const testKeys = [
    { key: 'bw_ex0i7udnrrumbzikdnd', expected: 'Flatline earthworks' },
    { key: 'bw_lcf7itxs8qocat5sd5', expected: 'Fixed Login Business' },
    { key: 'bw_y09k0oyq06t9peo4pd', expected: 'Test Business 2' }
  ];
  
  for (const test of testKeys) {
    console.log(`\n--- Testing API Key: ${test.key} ---`);
    console.log(`Expected Business: ${test.expected}`);
    
    try {
      const response = await fetch('https://bluecollarbizworx.replit.app/api/gpt/clients', {
        headers: { 'X-API-Key': test.key }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Status: ${response.status}`);
        console.log(`  Returned Business: "${data.businessVerification?.businessName}"`);
        console.log(`  Business ID: ${data.businessVerification?.businessId}`);
        console.log(`  Client Count: ${data.data?.length || 0}`);
        
        if (data.businessVerification?.businessName !== test.expected) {
          console.log(`  🚨 ISOLATION BREACH! Expected "${test.expected}" but got "${data.businessVerification?.businessName}"`);
        } else {
          console.log(`  ✓ Correct business returned`);
        }
        
        if (data.data && data.data.length > 0) {
          console.log(`  First client: ${data.data[0].name} (ID: ${data.data[0].id})`);
        }
      } else {
        console.log(`✗ HTTP ${response.status}: ${await response.text()}`);
      }
      
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
  }
  
  // Check database directly for API key mappings
  console.log('\n--- Direct Database Check ---');
  console.log('This should show which business each API key belongs to...');
}

emergencyBusinessIsolationDebug();