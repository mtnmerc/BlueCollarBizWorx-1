// Simple deployment test
console.log('Testing deployment accessibility...');

const testUrl = 'https://bluecollar-bizworx.replit.app/api/mcp/health';

fetch(testUrl)
  .then(response => {
    console.log(`Status: ${response.status}`);
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  })
  .then(data => {
    console.log('✓ MCP Server External Access Working!');
    console.log(`- Status: ${data.status}`);
    console.log(`- Tools: ${data.tools_count}`);
    console.log(`- Server: ${data.server}`);
  })
  .catch(error => {
    console.log('✗ External access still blocked:', error.message);
    console.log('Issue: Deployment configuration needs manual intervention');
  });