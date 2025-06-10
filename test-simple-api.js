#!/usr/bin/env node

async function testSimpleAPI() {
  console.log('Testing basic API connectivity...\n');
  
  const testUrls = [
    'https://bluecollar-bizworx.replit.app',
    'https://5000-bluecollar-bizworx.replit.app'
  ];
  
  for (const baseUrl of testUrls) {
    console.log(`Testing ${baseUrl}:`);
    
    try {
      // Test a known working endpoint
      const response = await fetch(`${baseUrl}/api/auth/me`);
      console.log(`  /api/auth/me - Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('  ✓ API routing works (expected 401 for auth endpoint)');
      } else {
        console.log(`  Response: ${await response.text()}`);
      }
    } catch (error) {
      console.log(`  ✗ Connection failed: ${error.message}`);
    }
    
    console.log('');
  }
}

testSimpleAPI().catch(console.error);