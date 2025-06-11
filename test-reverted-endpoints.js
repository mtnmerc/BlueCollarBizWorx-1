import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testRevertedEndpoints() {
  console.log('=== TESTING REVERTED SERVER ENDPOINTS ===\n');
  
  const endpoints = [
    { path: '/api/gpt/clients', method: 'GET', description: 'Get clients' },
    { path: '/api/gpt/clients/create', method: 'POST', description: 'Create client', body: { name: 'Test Client', email: 'test@test.com', phone: '555-0123', address: '123 Test St' } },
    { path: '/api/gpt/clients/1', method: 'DELETE', description: 'Delete client (test with ID 1)' },
    { path: '/api/gpt/jobs', method: 'GET', description: 'Get jobs' },
    { path: '/api/gpt/dashboard', method: 'GET', description: 'Get dashboard' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
      
      const options = {
        method: endpoint.method,
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS');
        if (data.data || data.clients || data.jobs) {
          const count = (data.data?.length || data.clients?.length || data.jobs?.length || 0);
          console.log(`Data count: ${count}`);
        }
      } else {
        console.log('❌ FAILED');
        const errorText = await response.text();
        console.log(`Error: ${errorText.substring(0, 100)}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('');
    }
  }
  
  console.log('=== ENDPOINT TEST COMPLETE ===');
}

testRevertedEndpoints();