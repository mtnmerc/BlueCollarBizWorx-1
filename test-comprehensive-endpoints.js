import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testEndpoint(path, method = 'GET', data = null) {
  try {
    const options = {
      method,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${BASE_URL}${path}`, options);
    const result = await response.json();
    
    console.log(`${method} ${path}:`);
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));
    console.log('---');
    
    return { status: response.status, data: result };
  } catch (error) {
    console.log(`${method} ${path}:`);
    console.log(`Error: ${error.message}`);
    console.log('---');
    return { status: 0, error: error.message };
  }
}

async function runComprehensiveTest() {
  console.log('=== COMPREHENSIVE CHATGPT API ENDPOINT TEST ===\n');

  // Test dashboard
  await testEndpoint('/api/gpt/dashboard');
  
  // Test clients
  await testEndpoint('/api/gpt/clients');
  await testEndpoint('/api/gpt/clients', 'POST', {
    name: 'Test Client via API',
    email: 'api-test@example.com',
    phone: '555-API-TEST'
  });
  
  // Test jobs
  await testEndpoint('/api/gpt/jobs');
  await testEndpoint('/api/gpt/jobs', 'POST', {
    clientId: 1,
    title: 'Test Job via API',
    description: 'Created through ChatGPT API',
    scheduledStart: new Date(Date.now() + 86400000).toISOString(),
    status: 'scheduled'
  });
  
  // Test invoices
  await testEndpoint('/api/gpt/invoices');
  await testEndpoint('/api/gpt/invoices', 'POST', {
    clientId: 1,
    title: 'Test Invoice via API',
    total: '500.00',
    lineItems: [
      { description: 'Test Service', quantity: 1, rate: '500.00', amount: '500.00' }
    ],
    subtotal: '500.00'
  });
  
  // Test estimates
  await testEndpoint('/api/gpt/estimates');
  await testEndpoint('/api/gpt/estimates', 'POST', {
    clientId: 1,
    title: 'Test Estimate via API',
    total: '750.00',
    lineItems: [
      { description: 'Test Service', quantity: 1, rate: '750.00', amount: '750.00' }
    ],
    subtotal: '750.00'
  });
  
  // Test services
  await testEndpoint('/api/gpt/services');
  await testEndpoint('/api/gpt/services', 'POST', {
    name: 'Test Service via API',
    description: 'Created through ChatGPT API',
    rate: '100.00',
    unit: 'hour'
  });
  
  // Test team
  await testEndpoint('/api/gpt/team');
  
  // Test revenue
  await testEndpoint('/api/gpt/revenue');
  
  // Test process endpoint
  await testEndpoint('/api/gpt/process', 'POST', {
    message: 'Show me today\'s jobs',
    intent: 'get_jobs',
    context: { date: new Date().toISOString().split('T')[0] }
  });

  console.log('\n=== TEST COMPLETE ===');
}

runComprehensiveTest().catch(console.error);