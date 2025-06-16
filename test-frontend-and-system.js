// Comprehensive frontend and system test
async function testFrontendAndSystem() {
  console.log('=== COMPREHENSIVE FRONTEND AND SYSTEM TEST ===\n');
  
  const baseUrl = 'https://bluecollarbizworx.replit.app';
  const results = [];
  
  function logResult(test, status, details) {
    results.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '?'} ${test}: ${details}`);
  }
  
  // Test 1: Frontend Load and Structure
  console.log('--- Frontend Load Test ---');
  try {
    const response = await fetch(baseUrl);
    if (response.ok) {
      const html = await response.text();
      
      // Check for React app structure
      if (html.includes('id="root"')) {
        logResult('Frontend Structure', 'PASS', 'React app root element present');
      } else {
        logResult('Frontend Structure', 'FAIL', 'Missing React root element');
      }
      
      // Check for required scripts
      if (html.includes('type="module"')) {
        logResult('Frontend Scripts', 'PASS', 'Module scripts detected');
      } else {
        logResult('Frontend Scripts', 'FAIL', 'Missing module scripts');
      }
      
      // Check for CSS/styling
      if (html.includes('tailwind') || html.includes('css')) {
        logResult('Frontend Styling', 'PASS', 'Styling detected');
      } else {
        logResult('Frontend Styling', 'WARN', 'No styling detected');
      }
      
    } else {
      logResult('Frontend Load', 'FAIL', `HTTP ${response.status}`);
    }
  } catch (error) {
    logResult('Frontend Load', 'FAIL', error.message);
  }
  
  // Test 2: API Route Structure
  console.log('\n--- API Route Structure Test ---');
  const apiRoutes = [
    { path: '/api/auth/business/register', method: 'POST', expected: 'business auth' },
    { path: '/api/auth/business/login', method: 'POST', expected: 'business auth' },
    { path: '/api/auth/setup', method: 'POST', expected: 'setup' },
    { path: '/api/auth/me', method: 'GET', expected: 'user info' },
    { path: '/api/clients', method: 'GET', expected: 'client data' },
    { path: '/api/jobs', method: 'GET', expected: 'job data' },
    { path: '/api/estimates', method: 'GET', expected: 'estimate data' },
    { path: '/api/invoices', method: 'GET', expected: 'invoice data' },
    { path: '/api/gpt/clients', method: 'GET', expected: 'GPT client data' },
    { path: '/api/gpt/estimates', method: 'GET', expected: 'GPT estimate data' },
    { path: '/api/generate-api-key', method: 'POST', expected: 'API key generation' }
  ];
  
  for (const route of apiRoutes) {
    try {
      const response = await fetch(`${baseUrl}${route.path}`, {
        method: route.method,
        headers: { 'Content-Type': 'application/json' },
        body: route.method !== 'GET' ? JSON.stringify({}) : undefined
      });
      
      const contentType = response.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        logResult(`API Route ${route.path}`, 'PASS', `Returns JSON (${response.status})`);
      } else if (contentType.includes('text/html')) {
        logResult(`API Route ${route.path}`, 'FAIL', 'Returns HTML instead of JSON - route missing');
      } else {
        logResult(`API Route ${route.path}`, 'WARN', `Unexpected content-type: ${contentType}`);
      }
      
    } catch (error) {
      logResult(`API Route ${route.path}`, 'FAIL', error.message);
    }
  }
  
  // Test 3: Authentication Flow
  console.log('\n--- Authentication Flow Test ---');
  
  // Create test business
  const testBusiness = {
    name: `System Test ${Date.now()}`,
    email: `test${Date.now()}@systemtest.com`,
    password: 'TestPass123!'
  };
  
  try {
    // Register business
    const registerResponse = await fetch(`${baseUrl}/api/auth/business/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBusiness)
    });
    
    if (registerResponse.ok) {
      const regData = await registerResponse.json();
      logResult('Business Registration', 'PASS', `Created business ID ${regData.business?.id}`);
      testBusiness.id = regData.business?.id;
      
      // Test login
      const loginResponse = await fetch(`${baseUrl}/api/auth/business/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testBusiness.email,
          password: testBusiness.password
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        logResult('Business Login', 'PASS', 'Login successful');
        
        if (loginData.setupMode) {
          logResult('Setup Mode Detection', 'PASS', 'Setup mode correctly detected');
        } else {
          logResult('Setup Mode Detection', 'WARN', 'Setup mode not detected');
        }
      } else {
        logResult('Business Login', 'FAIL', `Login failed: ${loginResponse.status}`);
      }
      
    } else {
      const error = await registerResponse.text();
      logResult('Business Registration', 'FAIL', `Registration failed: ${error}`);
    }
    
  } catch (error) {
    logResult('Authentication Flow', 'FAIL', error.message);
  }
  
  // Test 4: GPT API Integration
  console.log('\n--- GPT API Integration Test ---');
  
  // Test with known working API key
  const knownApiKey = 'bw_ex0i7udnrrumbzikdnd';
  
  try {
    const gptResponse = await fetch(`${baseUrl}/api/gpt/clients`, {
      headers: { 'X-API-Key': knownApiKey }
    });
    
    if (gptResponse.ok) {
      const data = await gptResponse.json();
      if (data.success && data.businessVerification) {
        logResult('GPT API Integration', 'PASS', `Working - ${data.data?.length || 0} clients for "${data.businessVerification.businessName}"`);
        
        // Test business isolation
        if (data.businessVerification.businessName === 'Flatline earthworks') {
          logResult('Business Isolation', 'PASS', 'Correct business data returned');
        } else {
          logResult('Business Isolation', 'FAIL', `Expected "Flatline earthworks", got "${data.businessVerification.businessName}"`);
        }
      } else {
        logResult('GPT API Integration', 'FAIL', 'Invalid response format');
      }
    } else {
      logResult('GPT API Integration', 'FAIL', `HTTP ${gptResponse.status}`);
    }
  } catch (error) {
    logResult('GPT API Integration', 'FAIL', error.message);
  }
  
  // Test 5: Check for missing endpoints
  console.log('\n--- Missing Endpoint Analysis ---');
  
  const missingRoutes = results.filter(r => r.details.includes('Returns HTML instead of JSON'));
  if (missingRoutes.length > 0) {
    logResult('Missing Routes Analysis', 'FAIL', `${missingRoutes.length} routes return HTML instead of JSON`);
    console.log('Missing routes:');
    missingRoutes.forEach(route => {
      console.log(`  - ${route.test}`);
    });
  } else {
    logResult('Missing Routes Analysis', 'PASS', 'All tested routes return proper JSON');
  }
  
  // Summary
  console.log('\n=== SYSTEM TEST SUMMARY ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARN').length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Warnings: ${warnings}`);
  
  if (failed > 0) {
    console.log('\n=== CRITICAL ISSUES FOUND ===');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`❌ ${r.test}: ${r.details}`);
    });
  }
  
  if (warnings > 0) {
    console.log('\n=== WARNINGS ===');
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(`⚠️  ${r.test}: ${r.details}`);
    });
  }
  
  return results;
}

testFrontendAndSystem();