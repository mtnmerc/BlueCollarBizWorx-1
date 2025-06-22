// Comprehensive BizWorx system test
async function comprehensiveSystemTest() {
  console.log('=== COMPREHENSIVE BIZWORX SYSTEM TEST ===\n');
  
  const baseUrl = 'https://bizworx-7faf4.web.app';
  const testResults = [];
  
  function logResult(test, status, details) {
    testResults.push({ test, status, details });
    console.log(`${status === 'PASS' ? '✓' : '✗'} ${test}: ${details}`);
  }
  
  // Test 1: Homepage/App Load
  console.log('--- Testing App Load ---');
  try {
    const homeResponse = await fetch(baseUrl);
    if (homeResponse.ok) {
      const html = await homeResponse.text();
      if (html.includes('BizWorx') && html.includes('root')) {
        logResult('Homepage Load', 'PASS', 'App loads correctly');
      } else {
        logResult('Homepage Load', 'FAIL', 'HTML missing expected content');
      }
    } else {
      logResult('Homepage Load', 'FAIL', `HTTP ${homeResponse.status}`);
    }
  } catch (error) {
    logResult('Homepage Load', 'FAIL', error.message);
  }
  
  // Test 2: Business Registration
  console.log('\n--- Testing Business Registration ---');
  const testBusinessData = {
    name: `Test Business ${Date.now()}`,
    email: `test${Date.now()}@systemtest.com`,
    password: 'TestPassword123!',
    phone: '555-0199',
    address: '123 Test St'
  };
  
  try {
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBusinessData)
    });
    
    if (registerResponse.ok) {
      const data = await registerResponse.json();
      if (data.business && data.business.id) {
        logResult('Business Registration', 'PASS', `Created business ID ${data.business.id}`);
        testBusinessData.id = data.business.id;
      } else {
        logResult('Business Registration', 'FAIL', 'No business ID returned');
      }
    } else {
      const error = await registerResponse.text();
      logResult('Business Registration', 'FAIL', `HTTP ${registerResponse.status}: ${error}`);
    }
  } catch (error) {
    logResult('Business Registration', 'FAIL', error.message);
  }
  
  // Test 3: Business Login
  console.log('\n--- Testing Business Login ---');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testBusinessData.email,
        password: testBusinessData.password
      })
    });
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      if (data.business && data.business.name === testBusinessData.name) {
        logResult('Business Login', 'PASS', 'Login successful');
      } else {
        logResult('Business Login', 'FAIL', 'Login response missing business data');
      }
    } else {
      const error = await loginResponse.text();
      logResult('Business Login', 'FAIL', `HTTP ${loginResponse.status}: ${error}`);
    }
  } catch (error) {
    logResult('Business Login', 'FAIL', error.message);
  }
  
  // Test 4: API Key Generation
  console.log('\n--- Testing API Key Generation ---');
  if (testBusinessData.id) {
    try {
      const apiKeyResponse = await fetch(`${baseUrl}/api/generate-api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: testBusinessData.id })
      });
      
      if (apiKeyResponse.ok) {
        const data = await apiKeyResponse.json();
        if (data.apiKey && data.apiKey.startsWith('bw_')) {
          logResult('API Key Generation', 'PASS', `Generated key: ${data.apiKey.substring(0, 10)}...`);
          testBusinessData.apiKey = data.apiKey;
        } else {
          logResult('API Key Generation', 'FAIL', 'Invalid API key format');
        }
      } else {
        const error = await apiKeyResponse.text();
        logResult('API Key Generation', 'FAIL', `HTTP ${apiKeyResponse.status}: ${error}`);
      }
    } catch (error) {
      logResult('API Key Generation', 'FAIL', error.message);
    }
  }
  
  // Test 5: GPT API Endpoints
  console.log('\n--- Testing GPT API Endpoints ---');
  if (testBusinessData.apiKey) {
    const gptEndpoints = ['/clients', '/estimates', '/invoices', '/jobs'];
    
    for (const endpoint of gptEndpoints) {
      try {
        const response = await fetch(`${baseUrl}/api/gpt${endpoint}`, {
          headers: { 'X-API-Key': testBusinessData.apiKey }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data) && data.businessVerification) {
            logResult(`GPT ${endpoint}`, 'PASS', `Returns ${data.data.length} items with proper format`);
          } else {
            logResult(`GPT ${endpoint}`, 'FAIL', 'Invalid response format');
          }
        } else {
          const error = await response.text();
          logResult(`GPT ${endpoint}`, 'FAIL', `HTTP ${response.status}: ${error}`);
        }
      } catch (error) {
        logResult(`GPT ${endpoint}`, 'FAIL', error.message);
      }
    }
  }
  
  return testResults;
}

comprehensiveSystemTest().then(results => {
  console.log('\n=== SYSTEM TEST SUMMARY ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFAILED TESTS:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`- ${r.test}: ${r.details}`);
    });
  }
});