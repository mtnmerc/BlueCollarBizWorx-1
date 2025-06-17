import fetch from 'node-fetch';

async function testIntegratedProxy() {
  console.log('Testing integrated proxy endpoints...\n');
  
  // Start the server first
  const { spawn } = await import('child_process');
  
  console.log('Starting BizWorx server...');
  const server = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'pipe',
    detached: false
  });
  
  server.stdout.on('data', (data) => {
    console.log('Server:', data.toString().trim());
  });
  
  server.stderr.on('data', (data) => {
    console.log('Server Error:', data.toString().trim());
  });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 8000));
  
  try {
    // Test proxy health endpoint
    console.log('\n1. Testing proxy health endpoint...');
    const healthResponse = await fetch('http://localhost:5000/proxy/health');
    const healthData = await healthResponse.json();
    console.log('Proxy health status:', healthResponse.status);
    console.log('Proxy health response:', JSON.stringify(healthData, null, 2));
    
    // Test proxy with API key
    console.log('\n2. Testing proxy clients endpoint...');
    const clientsResponse = await fetch('http://localhost:5000/proxy/api/gpt/clients', {
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
    
    // Test proxy without API key
    console.log('\n3. Testing proxy without API key...');
    const noKeyResponse = await fetch('http://localhost:5000/proxy/api/gpt/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const noKeyData = await noKeyResponse.json();
    console.log('No key response status:', noKeyResponse.status);
    console.log('No key response:', JSON.stringify(noKeyData, null, 2));
    
    console.log('\n✅ Integrated proxy testing complete!');
    console.log('Your deployment proxy URL: https://bluecollarbizworx.replit.app/proxy/api/gpt/[endpoint]');
    
  } catch (error) {
    console.error('Test error:', error.message);
  } finally {
    server.kill();
  }
}

testIntegratedProxy();