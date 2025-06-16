// Test basic connectivity and MCP endpoints
console.log('Testing Replit deployment connectivity...');

const baseUrl = 'https://bluecollar-bizworx.replit.app';
const tests = [
  { url: `${baseUrl}/health`, name: 'Basic Health Check' },
  { url: `${baseUrl}/api/mcp/health`, name: 'MCP Health Check' },
  { url: `${baseUrl}/api/mcp/test`, name: 'MCP Test Endpoint' }
];

async function runTests() {
  for (const test of tests) {
    try {
      const response = await fetch(test.url);
      console.log(`${test.name}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ ${test.name} working:`, data.status || data.message);
      } else {
        console.log(`✗ ${test.name} failed: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`✗ ${test.name} error:`, error.message);
    }
  }
}

runTests();