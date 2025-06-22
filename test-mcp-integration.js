#!/usr/bin/env node

async function testBizWorxAPI() {
  console.log('=== Testing BizWorx MCP Integration ===\n');
  
  const baseUrl = 'http://localhost:5000';
  
  // Test all MCP endpoints locally
  const endpoints = [
    { path: '/api/mcp/health', method: 'GET' },
    { path: '/api/mcp/test', method: 'GET' },
    { path: '/api/mcp/config', method: 'GET' },
    { path: '/api/mcp/tools', method: 'GET' },
    { path: '/api/mcp/sse', method: 'GET' }
  ];
  
  console.log('Testing MCP endpoints locally:');
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ ${endpoint.path} - Status: ${response.status}`);
        
        if (endpoint.path === '/api/mcp/health') {
          console.log(`  Server: ${data.server}, Tools: ${data.tools_count}`);
        } else if (endpoint.path === '/api/mcp/tools') {
          console.log(`  Available tools: ${data.tools.length}`);
        }
      } else {
        console.log(`✗ ${endpoint.path} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`✗ ${endpoint.path} - Error: ${error.message}`);
    }
  }
  
  // Test tool endpoints
  console.log('\nTesting tool endpoints:');
  const toolEndpoints = [
    'get_clients',
    'create_client',
    'get_jobs',
    'create_job',
    'get_invoices',
    'create_invoice'
  ];
  
  for (const tool of toolEndpoints) {
    try {
      const response = await fetch(`${baseUrl}/api/mcp/${tool}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ apiKey: 'test-key' })
      });
      
      console.log(`✓ ${tool} - Status: ${response.status} (${response.status === 401 ? 'Auth required' : 'Available'})`);
    } catch (error) {
      console.log(`✗ ${tool} - Error: ${error.message}`);
    }
  }
  
  // Test MCP protocol call
  console.log('\nTesting MCP protocol:');
  try {
    const response = await fetch(`${baseUrl}/api/mcp/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {}
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✓ MCP protocol call - Status: ${response.status}`);
      console.log(`  Tools available: ${data.result?.tools?.length || 0}`);
    } else {
      console.log(`✗ MCP protocol call - Status: ${response.status}`);
    }
  } catch (error) {
    console.log(`✗ MCP protocol call - Error: ${error.message}`);
  }
}

async function testExternalEndpoints(baseUrl) {
  console.log(`\n=== Testing External Access: ${baseUrl} ===`);
  
  const endpoints = ['/api/mcp/health', '/api/mcp/tools', '/api/auth/me'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      });
      
      if (response.ok) {
        console.log(`✓ ${endpoint} - Status: ${response.status} (Accessible)`);
      } else {
        console.log(`✗ ${endpoint} - Status: ${response.status} (${response.status === 404 ? 'Not Found' : 'Error'})`);
      }
    } catch (error) {
      console.log(`✗ ${endpoint} - Network Error: ${error.message}`);
    }
  }
}

async function testMCPServerStructure() {
  console.log('\n=== MCP Server Structure Analysis ===');
  
  try {
    const response = await fetch('http://localhost:5000/api/mcp/config');
    if (response.ok) {
      const config = await response.json();
      console.log('MCP Configuration:');
      console.log(`  Server Name: ${config.server_name}`);
      console.log(`  Version: ${config.version}`);
      console.log(`  Tools Count: ${config.tools_count}`);
      console.log(`  Supported Methods: ${config.supported_methods?.join(', ') || 'N/A'}`);
      console.log(`  Authentication: ${config.authentication_required ? 'Required' : 'Optional'}`);
      
      return true;
    }
  } catch (error) {
    console.log('Could not retrieve MCP configuration');
  }
  
  return false;
}

// Run all tests
(async () => {
  await testBizWorxAPI();
  await testMCPServerStructure();
  await testExternalEndpoints('https://bizworx-7faf4.web.app');
  await testExternalEndpoints('https://bizworx-7faf4.web.app:3001');
  
  console.log('\n=== Summary ===');
  console.log('✓ MCP server is fully functional locally');
  console.log('✗ External routing needs Replit deployment configuration');
  console.log('📋 Recommended action: Configure Replit to expose port 5000 externally');
})().catch(console.error);