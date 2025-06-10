// Test script to verify external MCP server accessibility
import fetch from 'node-fetch';

// Test both the main domain and potential subdomain configurations
const testUrls = [
  'https://bluecollar-bizworx.replit.app',
  'https://5000-bluecollar-bizworx.replit.app'
];

const baseUrl = testUrls[0];

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

async function testMultipleUrls() {
  console.log('=== Testing Multiple URL Configurations ===\n');
  
  const endpoints = [
    '/mcp/health',
    '/mcp/test', 
    '/mcp/config',
    '/mcp/tools'
  ];
  
  for (const testUrl of testUrls) {
    console.log(`\n--- Testing ${testUrl} ---`);
    let urlResults = [];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${testUrl}${endpoint}`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        const success = response.status === 200;
        console.log(`${success ? '✓' : '✗'} ${endpoint} - Status: ${response.status}`);
        
        if (success) {
          const data = await response.json();
          console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
        }
        
        urlResults.push({ endpoint, success, status: response.status });
      } catch (error) {
        console.log(`✗ ${endpoint} - Error: ${error.message}`);
        urlResults.push({ endpoint, success: false, error: error.message });
      }
    }
    
    const successful = urlResults.filter(r => r.success).length;
    console.log(`\nResults for ${testUrl}: ${successful}/${endpoints.length} successful`);
    
    if (successful === endpoints.length) {
      console.log(`\n✓ SUCCESS: All MCP endpoints accessible via ${testUrl}`);
      console.log('\nFor N8N configuration:');
      console.log(`Base URL: ${testUrl}/mcp`);
      console.log(`SSE URL: ${testUrl}/mcp/sse`);
      console.log('Authentication: X-API-Key header required');
      return true;
    }
  }
  
  return false;
}

async function runTests() {
  console.log('=== Testing External MCP Server Accessibility ===\n');
  
  const success = await testMultipleUrls();
  
  if (!success) {
    console.log('\n⚠ MCP endpoints may not be externally accessible through standard URLs');
    console.log('\nTrying localhost test for comparison:');
    
    try {
      const localResponse = await fetch('http://localhost:5000/mcp/health');
      if (localResponse.status === 200) {
        console.log('✓ Local access works - this confirms the server is running');
        console.log('  Issue appears to be with external routing configuration');
      }
    } catch (error) {
      console.log('✗ Local access also failed - server may not be running');
    }
  }
}

runTests().catch(console.error);