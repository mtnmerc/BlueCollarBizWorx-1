import fetch from 'node-fetch';

async function testLiveProxy() {
  const baseUrl = 'https://bluecollarbizwoex.replit.app:3001';
  
  console.log('Testing live proxy URL...\n');
  
  try {
    // Test health endpoint
    console.log(`Testing: ${baseUrl}/health`);
    const healthResponse = await fetch(`${baseUrl}/health`, { timeout: 10000 });
    console.log(`Health Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`Health Response: ${JSON.stringify(healthData, null, 2)}`);
    }
    
    // Test API endpoint with API key
    console.log(`\nTesting: ${baseUrl}/api/gpt/clients`);
    const clientsResponse = await fetch(`${baseUrl}/api/gpt/clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: 'bw_wkad606ephtmbqx7a0f'
      }),
      timeout: 10000
    });
    
    console.log(`Clients Status: ${clientsResponse.status}`);
    
    if (clientsResponse.ok || clientsResponse.status < 500) {
      const clientsData = await clientsResponse.json();
      console.log(`Clients Response: ${JSON.stringify(clientsData, null, 2)}`);
    }
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

testLiveProxy();