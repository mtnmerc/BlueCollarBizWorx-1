// Debug API key and account mapping for alter3d24@gmail.com
async function debugAccountApiKeyMismatch() {
  console.log('=== DEBUGGING ACCOUNT API KEY MISMATCH ===\n');
  
  const userEmail = 'alter3d24@gmail.com';
  const testApiKey = 'bw_ex0i7udnrrumbzikdnd';
  const baseUrl = 'https://bizworx-7faf4.web.app';
  
  console.log(`User Email: ${userEmail}`);
  console.log(`Test API Key: ${testApiKey}\n`);
  
  // Test 1: Direct database query to find business by email
  console.log('--- Test 1: Database Query by Email ---');
  try {
    const response = await fetch(`${baseUrl}/api/debug/business-by-email?email=${encodeURIComponent(userEmail)}`);
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Business found by email:', JSON.stringify(data, null, 2));
    } else {
      console.log('✗ No business found for email');
    }
  } catch (error) {
    console.log('✗ Error querying by email:', error.message);
  }
  
  // Test 2: Check what business the API key belongs to
  console.log('\n--- Test 2: API Key Business Lookup ---');
  try {
    const response = await fetch(`${baseUrl}/api/gpt/clients`, {
      headers: { 'X-API-Key': testApiKey }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ API Key maps to business:');
      console.log(`  Business Name: ${data.businessVerification?.businessName}`);
      console.log(`  Business ID: ${data.businessVerification?.businessId}`);
      console.log(`  Data Count: ${data.data?.length} clients`);
    } else {
      console.log('✗ API key authentication failed');
    }
  } catch (error) {
    console.log('✗ Error with API key:', error.message);
  }
  
  // Test 3: List all businesses to see what exists
  console.log('\n--- Test 3: All Businesses in Database ---');
  try {
    const response = await fetch(`${baseUrl}/api/debug/all-businesses`);
    if (response.ok) {
      const businesses = await response.json();
      console.log('✓ All businesses in database:');
      businesses.forEach((business, index) => {
        console.log(`  ${index + 1}. ID: ${business.id}, Name: "${business.name}", Email: "${business.email}", API Key: ${business.apiKey ? business.apiKey.substring(0, 10) + '...' : 'None'}`);
      });
    } else {
      console.log('✗ Could not fetch all businesses');
    }
  } catch (error) {
    console.log('✗ Error fetching businesses:', error.message);
  }
  
  // Test 4: Check if user account exists in system
  console.log('\n--- Test 4: User Account Check ---');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userEmail,
        password: 'test' // This will fail but show if account exists
      })
    });
    
    const loginText = await loginResponse.text();
    console.log(`Login attempt status: ${loginResponse.status}`);
    console.log(`Response: ${loginText}`);
    
    if (loginText.includes('Invalid credentials') || loginText.includes('password')) {
      console.log('✓ Account exists (password invalid as expected)');
    } else if (loginText.includes('not found') || loginText.includes('No business')) {
      console.log('✗ Account does not exist');
    }
  } catch (error) {
    console.log('✗ Error checking account:', error.message);
  }
  
  console.log('\n=== DIAGNOSIS ===');
  console.log('This will help identify:');
  console.log('1. Whether alter3d24@gmail.com has a business account');
  console.log('2. What business the API key bw_ex0i7udnrrumbzikdnd belongs to');
  console.log('3. If there\'s a mismatch between the account and API key');
  console.log('4. All available businesses in the system');
}

debugAccountApiKeyMismatch();