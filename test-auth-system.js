// Test authentication system endpoints
async function testAuthSystem() {
  console.log('=== TESTING AUTHENTICATION SYSTEM ===\n');
  
  const baseUrl = 'https://bizworx-7faf4.web.app';
  
  // Test 1: Check if auth routes exist
  console.log('--- Testing Auth Route Responses ---');
  const authTests = [
    { endpoint: '/api/auth/register', method: 'POST' },
    { endpoint: '/api/auth/login', method: 'POST' },
    { endpoint: '/api/generate-api-key', method: 'POST' }
  ];
  
  for (const test of authTests) {
    try {
      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: test.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'data' })
      });
      
      console.log(`${test.endpoint}: Status ${response.status}`);
      const contentType = response.headers.get('content-type');
      console.log(`  Content-Type: ${contentType}`);
      
      const responseText = await response.text();
      if (responseText.includes('<!DOCTYPE')) {
        console.log(`  ✗ Returns HTML instead of JSON - routing issue`);
      } else if (responseText.includes('error') || responseText.includes('Invalid')) {
        console.log(`  ✓ Returns JSON error response - endpoint exists`);
      } else {
        console.log(`  ? Returns: ${responseText.substring(0, 100)}...`);
      }
      
    } catch (error) {
      console.log(`${test.endpoint}: Error - ${error.message}`);
    }
    console.log();
  }
  
  // Test 2: Check existing business login
  console.log('--- Testing Existing Business Login ---');
  try {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'alter3d24@gmail.com',
        password: 'wrongpassword'
      })
    });
    
    console.log(`Login test: Status ${response.status}`);
    const responseText = await response.text();
    if (responseText.includes('<!DOCTYPE')) {
      console.log(`✗ Login returns HTML - auth system broken`);
    } else {
      console.log(`✓ Login returns JSON response`);
      console.log(`Response: ${responseText.substring(0, 200)}`);
    }
    
  } catch (error) {
    console.log(`Login test error: ${error.message}`);
  }
  
  // Test 3: Check if routes are registered
  console.log('\n--- Testing Route Registration ---');
  const routeTests = [
    '/api/auth',
    '/api/gpt',
    '/api/clients',
    '/api/jobs'
  ];
  
  for (const route of routeTests) {
    try {
      const response = await fetch(`${baseUrl}${route}`);
      console.log(`${route}: Status ${response.status}`);
      if (response.status === 404) {
        console.log(`  ✗ Route not found`);
      } else {
        console.log(`  ✓ Route exists`);
      }
    } catch (error) {
      console.log(`${route}: Error - ${error.message}`);
    }
  }
}

testAuthSystem();