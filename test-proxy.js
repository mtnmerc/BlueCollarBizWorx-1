import fetch from 'node-fetch';

async function testProxy() {
  console.log('Testing proxy server...');
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health check...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('Health check response:', healthData);
    
    // Test 2: Test with API key
    console.log('\n2. Testing clients endpoint with API key...');
    const clientsResponse = await fetch('http://localhost:3001/api/gpt/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: 'bw_wkad606ephtmbqx7a0f'
      })
    });
    
    const clientsData = await clientsResponse.json();
    console.log('Clients response status:', clientsResponse.status);
    console.log('Clients response:', JSON.stringify(clientsData, null, 2));
    
    // Test 3: Test without API key
    console.log('\n3. Testing without API key (should fail)...');
    const noKeyResponse = await fetch('http://localhost:3001/api/gpt/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const noKeyData = await noKeyResponse.json();
    console.log('No key response status:', noKeyResponse.status);
    console.log('No key response:', JSON.stringify(noKeyData, null, 2));
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testProxy();