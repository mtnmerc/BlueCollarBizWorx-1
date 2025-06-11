import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testEndpoint(path, headers = {}) {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    const text = await response.text();
    let data = null;
    
    try {
      data = JSON.parse(text);
    } catch (e) {
      // Not JSON
    }
    
    return {
      status: response.status,
      data: data,
      rawText: text.substring(0, 100)
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message
    };
  }
}

async function checkDeploymentStatus() {
  console.log('Checking current deployment status for ChatGPT integration...\n');
  
  const tests = [
    { path: '/api/gpt/test', name: 'Test endpoint' },
    { path: '/api/gpt/clients', name: 'Clients endpoint' },
    { path: '/api/gpt/jobs', name: 'Jobs endpoint' },
    { path: '/api/gpt/dashboard', name: 'Dashboard endpoint' }
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await testEndpoint(test.path);
    results.push({
      name: test.name,
      path: test.path,
      status: result.status,
      working: result.status === 200,
      hasData: result.data?.success === true
    });
    
    console.log(`${test.name} (${test.path}): ${result.status}`);
    if (result.status === 200 && result.data) {
      if (result.data.data && Array.isArray(result.data.data)) {
        console.log(`  Data count: ${result.data.data.length}`);
      }
      if (result.data.message) {
        console.log(`  Message: ${result.data.message}`);
      }
    } else if (result.status === 404) {
      console.log(`  ❌ Not found - endpoint not registered`);
    }
  }
  
  console.log('\nSummary:');
  const working = results.filter(r => r.working);
  const broken = results.filter(r => !r.working);
  
  console.log(`Working endpoints: ${working.length}/${results.length}`);
  console.log(`Broken endpoints: ${broken.length}`);
  
  if (broken.length > 0) {
    console.log('\nBroken endpoints:');
    broken.forEach(b => {
      console.log(`- ${b.name}: ${b.status}`);
    });
  }
  
  if (working.length === results.length) {
    console.log('\n✅ All endpoints working - ChatGPT integration should function');
  } else {
    console.log('\n⚠️ Some endpoints need attention');
  }
  
  // Test authentic data access
  console.log('\nChecking authentic data access:');
  const clientResult = await testEndpoint('/api/gpt/clients');
  if (clientResult.status === 200 && clientResult.data?.data) {
    const realClients = clientResult.data.data.filter(c => 
      c.name === 'John Deere' || c.name === 'Christine Vasickanin'
    );
    console.log(`Real clients accessible: ${realClients.length}`);
    realClients.forEach(client => {
      console.log(`- ${client.name}: ${client.email}`);
    });
  }
}

checkDeploymentStatus();