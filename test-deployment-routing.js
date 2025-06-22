#!/usr/bin/env node

async function testDeploymentRouting() {
  const baseUrl = 'https://bizworx-7faf4.web.app';
  
  console.log('Testing deployment routing...\n');
  
  // Test root path
  try {
    const response = await fetch(baseUrl);
    console.log(`Root (/) - Status: ${response.status}`);
    
    if (response.ok) {
      const text = await response.text();
      const isHTML = text.includes('<html') || text.includes('<!DOCTYPE');
      console.log(`  Content type: ${isHTML ? 'HTML (React app)' : 'Other'}`);
      
      if (isHTML) {
        console.log('  ✓ Frontend is being served');
      }
    } else {
      console.log(`  Error: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`  Connection error: ${error.message}`);
  }
  
  // Test various API endpoints to see routing pattern
  const endpoints = [
    '/api',
    '/api/auth',
    '/api/auth/me',
    '/api/clients',
    '/api/mcp',
    '/api/mcp/health'
  ];
  
  console.log('\nTesting API routing:');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`);
      console.log(`${endpoint} - Status: ${response.status}`);
      
      if (response.status !== 404) {
        const contentType = response.headers.get('content-type');
        console.log(`  Content-Type: ${contentType}`);
      }
    } catch (error) {
      console.log(`${endpoint} - Error: ${error.message}`);
    }
  }
  
  // Check if Express server is actually running by testing locally
  console.log('\nLocal server verification:');
  try {
    const localResponse = await fetch('http://localhost:5000/api/mcp/health');
    if (localResponse.ok) {
      const data = await localResponse.json();
      console.log(`✓ Local MCP server working: ${data.status} (${data.tools_count} tools)`);
    }
  } catch (error) {
    console.log(`✗ Local server issue: ${error.message}`);
  }
}

testDeploymentRouting().catch(console.error);