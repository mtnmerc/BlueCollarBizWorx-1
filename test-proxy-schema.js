import fetch from 'node-fetch';

async function testProxySchema() {
  console.log('Testing proxy schema endpoints...\n');
  
  const baseUrl = 'https://bluecollarbizworx.replit.app/proxy/api/gpt';
  const apiKey = 'bw_wkad606ephtmbqx7a0f';
  
  const tests = [
    {
      name: 'Get Clients (POST with API key)',
      endpoint: '/clients',
      method: 'POST',
      body: { api_key: apiKey }
    },
    {
      name: 'Get Estimates (POST with API key)',
      endpoint: '/estimates',
      method: 'POST', 
      body: { api_key: apiKey }
    },
    {
      name: 'Create Client (with API key)',
      endpoint: '/clients',
      method: 'POST',
      body: {
        api_key: apiKey,
        name: 'Test Client via Proxy',
        email: 'test@proxy.com',
        phone: '555-0123'
      }
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`URL: ${baseUrl}${test.endpoint}`);
      
      const response = await fetch(`${baseUrl}${test.endpoint}`, {
        method: test.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(test.body)
      });
      
      console.log(`Status: ${response.status}`);
      
      const data = await response.json();
      console.log(`Response: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
    
    console.log('---\n');
  }
}

testProxySchema();