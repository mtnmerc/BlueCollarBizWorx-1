import { spawn } from 'child_process';
import fetch from 'node-fetch';

async function startCompleteSystem() {
  console.log('Starting BizWorx complete system...\n');
  
  // Start main application
  console.log('1. Starting main BizWorx application on port 5000...');
  const mainApp = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'pipe',
    detached: false
  });
  
  mainApp.stdout.on('data', (data) => {
    console.log('Main App:', data.toString().trim());
  });
  
  mainApp.stderr.on('data', (data) => {
    console.log('Main App Error:', data.toString().trim());
  });
  
  // Wait for main app to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Start proxy server
  console.log('\n2. Starting ChatGPT proxy server on port 3001...');
  const proxyApp = spawn('node', ['proxy-server.js'], {
    stdio: 'pipe',
    detached: false
  });
  
  proxyApp.stdout.on('data', (data) => {
    console.log('Proxy:', data.toString().trim());
  });
  
  proxyApp.stderr.on('data', (data) => {
    console.log('Proxy Error:', data.toString().trim());
  });
  
  // Wait for proxy to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test the complete system
  console.log('\n3. Testing complete system integration...');
  
  try {
    // Test main app health
    console.log('\nTesting main app health...');
    const mainHealth = await fetch('http://localhost:5000/api/health');
    console.log('Main app status:', mainHealth.status);
    
    // Test proxy health
    console.log('\nTesting proxy health...');
    const proxyHealth = await fetch('http://localhost:3001/health');
    const proxyData = await proxyHealth.json();
    console.log('Proxy health:', proxyData);
    
    // Test end-to-end ChatGPT proxy
    console.log('\nTesting ChatGPT proxy with API key...');
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
    console.log('Clients data:', JSON.stringify(clientsData, null, 2));
    
    console.log('\n✅ System is running successfully!');
    console.log('Main BizWorx app: http://localhost:5000');
    console.log('ChatGPT Proxy: http://localhost:3001');
    
  } catch (error) {
    console.error('System test error:', error.message);
  }
  
  // Keep processes running
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    mainApp.kill();
    proxyApp.kill();
    process.exit();
  });
  
  console.log('\nSystem running. Press Ctrl+C to stop.');
}

startCompleteSystem().catch(console.error);