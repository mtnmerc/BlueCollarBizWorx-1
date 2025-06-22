// Test API authentication after deployment
async function testApiAuth() {
  const testKeys = [
    'bw_lcf7itxs8qocat5sd5',
    'bw_uc17ycnemnaev8segsw'
  ];

  for (const apiKey of testKeys) {
    console.log(`\n=== Testing API Key: ${apiKey} ===`);
    
    try {
      const response = await fetch('https://bizworx-7faf4.web.app/api/gpt/clients', {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('Status:', response.status);
      console.log('Headers:', Object.fromEntries(response.headers));
      
      const responseText = await response.text();
      console.log('Response:', responseText);
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('Success - Business:', data.businessVerification?.businessName);
        console.log('Clients count:', data.data?.length || 0);
      } else {
        console.log('Failed with status:', response.status);
      }
      
    } catch (error) {
      console.error('Request failed:', error.message);
    }
  }
}

testApiAuth();