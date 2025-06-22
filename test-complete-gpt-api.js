import fetch from 'node-fetch';

const BASE_URL = 'https://bizworx-7faf4.web.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

const endpoints = [
  { path: '/api/gpt/dashboard', method: 'GET', description: 'Dashboard stats' },
  { path: '/api/gpt/clients', method: 'GET', description: 'Get all clients' },
  { path: '/api/gpt/clients', method: 'POST', description: 'Create client', data: { name: 'Test Client GPT', email: 'test@gpt.com' } },
  { path: '/api/gpt/jobs', method: 'GET', description: 'Get all jobs' },
  { path: '/api/gpt/jobs', method: 'POST', description: 'Create job', data: { clientId: 1, title: 'Test GPT Job', scheduledStart: new Date().toISOString() } },
  { path: '/api/gpt/invoices', method: 'GET', description: 'Get all invoices' },
  { path: '/api/gpt/invoices', method: 'POST', description: 'Create invoice', data: { clientId: 1, title: 'Test Invoice', total: '100.00', lineItems: [] } },
  { path: '/api/gpt/estimates', method: 'GET', description: 'Get all estimates' },
  { path: '/api/gpt/estimates', method: 'POST', description: 'Create estimate', data: { clientId: 1, title: 'Test Estimate', total: '200.00', lineItems: [] } },
  { path: '/api/gpt/services', method: 'GET', description: 'Get all services' },
  { path: '/api/gpt/services', method: 'POST', description: 'Create service', data: { name: 'Test Service', rate: '50.00' } },
  { path: '/api/gpt/team', method: 'GET', description: 'Get team members' },
  { path: '/api/gpt/revenue', method: 'GET', description: 'Get revenue stats' }
];

async function testEndpoint(endpoint) {
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    if (endpoint.data) {
      options.body = JSON.stringify(endpoint.data);
    }

    const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
    const data = await response.json();
    
    console.log(`${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
    console.log(`Status: ${response.status}`);
    console.log(`Success: ${data.success}`);
    if (data.message) console.log(`Message: ${data.message}`);
    if (data.data && Array.isArray(data.data)) {
      console.log(`Data count: ${data.data.length}`);
    } else if (data.data) {
      console.log(`Data: ${JSON.stringify(data.data).substring(0, 100)}...`);
    }
    console.log('---');
    
    return response.status === 200 && data.success;
  } catch (error) {
    console.log(`${endpoint.method} ${endpoint.path} - FAILED`);
    console.log(`Error: ${error.message}`);
    console.log('---');
    return false;
  }
}

async function runComprehensiveTest() {
  console.log('=== COMPREHENSIVE CHATGPT API TEST ===\n');
  
  let passed = 0;
  let total = endpoints.length;
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint);
    if (success) passed++;
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between requests
  }
  
  console.log('=== RESULTS ===');
  console.log(`Passed: ${passed}/${total}`);
  console.log(`Success Rate: ${((passed/total) * 100).toFixed(1)}%`);
  
  if (passed === total) {
    console.log('🎉 All ChatGPT API endpoints are functional!');
  } else {
    console.log(`⚠️  ${total - passed} endpoints need attention`);
  }
}

runComprehensiveTest();