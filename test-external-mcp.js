// Test script to verify external MCP server accessibility
const fetch = require('node-fetch');

const baseUrl = 'https://bluecollar-bizworx.replit.app';

async function testEndpoint(endpoint, method = 'GET', headers = {}) {
  try {
    console.log(`Testing ${method} ${endpoint}...`);
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method,
      headers: {
        'Accept': 'application/json',
        ...headers
      }
    });
    
    const status = response.status;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✓ ${endpoint} - Status: ${status}`);
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log(`⚠ ${endpoint} - Status: ${status} (Non-JSON response)`);
      console.log('Response type:', contentType);
      console.log('First 200 chars:', text.substring(0, 200));
    }
    
    return { status, success: status < 400 };
  } catch (error) {
    console.log(`✗ ${endpoint} - Error: ${error.message}`);
    return { status: 0, success: false, error: error.message };
  }
}

async function testSSE(endpoint) {
  try {
    console.log(`\nTesting SSE ${endpoint}...`);
    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache'
      }
    });
    
    console.log(`SSE Status: ${response.status}`);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (response.status === 200) {
      console.log('✓ SSE endpoint is accessible');
      return true;
    } else {
      console.log('⚠ SSE endpoint returned non-200 status');
      return false;
    }
  } catch (error) {
    console.log(`✗ SSE ${endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('=== Testing External MCP Server Accessibility ===\n');
  
  const endpoints = [
    '/mcp/health',
    '/mcp/test', 
    '/mcp/config',
    '/mcp/tools'
  ];
  
  const results = [];
  
  // Test regular endpoints
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push({ endpoint, ...result });
    console.log(''); // Add spacing
  }
  
  // Test SSE endpoint
  const sseResult = await testSSE('/mcp/sse');
  results.push({ endpoint: '/mcp/sse', success: sseResult });
  
  // Summary
  console.log('\n=== Test Summary ===');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`Successful: ${successful}/${total}`);
  
  results.forEach(result => {
    const status = result.success ? '✓' : '✗';
    console.log(`${status} ${result.endpoint}`);
  });
  
  if (successful === total) {
    console.log('\n🎉 All MCP endpoints are externally accessible!');
    console.log('\nFor N8N configuration:');
    console.log(`SSE URL: ${baseUrl}/mcp/sse`);
    console.log('Authentication: X-API-Key header required');
  } else {
    console.log('\n⚠ Some endpoints may not be externally accessible');
  }
}

runTests().catch(console.error);