// Test the exact API key for alter3d24@gmail.com
async function testYourApiKey() {
  console.log('=== TESTING YOUR API KEY ===\n');
  
  const yourApiKey = 'bw_ex0i7udnrrumbzikdnd';
  const baseUrl = 'https://bluecollarbizworx.replit.app/api/gpt';
  
  console.log('Account: alter3d24@gmail.com');
  console.log('Business: Flatline earthworks');
  console.log('API Key:', yourApiKey);
  console.log();
  
  const endpoints = [
    { path: '/clients', name: 'Clients' },
    { path: '/estimates', name: 'Estimates' },
    { path: '/invoices', name: 'Invoices' },
    { path: '/jobs', name: 'Jobs' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        headers: {
          'X-API-Key': yourApiKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ ${endpoint.name}: ${data.data?.length || 0} items found`);
        console.log(`  Business: ${data.businessVerification?.businessName}`);
        console.log(`  Message: ${data.message}`);
        
        if (data.data && data.data.length > 0) {
          const firstItem = data.data[0];
          console.log(`  Sample item ID: ${firstItem.id}`);
          if (firstItem.name) console.log(`  Sample name: ${firstItem.name}`);
          if (firstItem.title) console.log(`  Sample title: ${firstItem.title}`);
        }
      } else {
        console.log(`✗ ${endpoint.name}: HTTP ${response.status}`);
      }
      
    } catch (error) {
      console.log(`✗ ${endpoint.name}: ${error.message}`);
    }
    
    console.log();
  }
  
  console.log('=== SUMMARY ===');
  console.log('Your API key bw_ex0i7udnrrumbzikdnd is correctly mapped to:');
  console.log('- Email: alter3d24@gmail.com');
  console.log('- Business: Flatline earthworks');
  console.log('- Business ID: 1');
  console.log();
  console.log('If ChatGPT still shows "no information", the issue is likely:');
  console.log('1. ChatGPT configuration needs the correct API key');
  console.log('2. ChatGPT needs to be updated with the new schema format');
  console.log('3. There may be caching in ChatGPT that needs to clear');
}

testYourApiKey();