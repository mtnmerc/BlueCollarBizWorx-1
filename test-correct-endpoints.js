#!/usr/bin/env node

async function testCorrectEndpoints() {
  console.log('Testing MCP endpoints with correct external routing...\n');
  
  const baseUrl = 'https://bluecollar-bizworx.replit.app';
  
  const endpoints = [
    '/api/mcp/health',
    '/api/mcp/test',
    '/api/mcp/config', 
    '/api/mcp/tools'
  ];
  
  console.log(`Testing ${baseUrl}:`);
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCP-Test-Client/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`  ✓ ${endpoint} - Status: ${response.status}`);
        if (endpoint === '/api/mcp/health') {
          console.log(`    Server: ${data.server}, Tools: ${data.tools_count}`);
        }
      } else {
        console.log(`  ✗ ${endpoint} - Status: ${response.status}`);
        const text = await response.text();
        if (text.length < 100) {
          console.log(`    Error: ${text}`);
        }
      }
    } catch (error) {
      console.log(`  ✗ ${endpoint} - Error: ${error.message}`);
    }
  }
  
  // Test a tool endpoint with proper authentication
  console.log('\nTesting tool endpoint (should require API key):');
  try {
    const response = await fetch(`${baseUrl}/api/mcp/get_clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ apiKey: 'test-key' })
    });
    
    console.log(`  POST /api/mcp/get_clients - Status: ${response.status}`);
    if (response.status === 401 || response.status === 403) {
      console.log(`    ✓ Authentication required (expected)`);
    } else {
      const text = await response.text();
      console.log(`    Response: ${text.substring(0, 200)}`);
    }
  } catch (error) {
    console.log(`  ✗ Tool endpoint error: ${error.message}`);
  }
}

testCorrectEndpoints().catch(console.error);