
#!/usr/bin/env node

// Diagnostic test to verify multi-device session conflicts
import fetch from 'node-fetch';

const BASE_URL = 'https://5000-bluecollar-bizworx.replit.app';

async function testSessionConflict() {
  console.log('🔍 Testing Multi-Device Session Conflict');
  console.log('==========================================\n');

  // Test 1: Check Vite HMR endpoint behavior
  console.log('1. Testing Vite HMR Connection...');
  try {
    const viteResponse = await fetch(`${BASE_URL}/@vite/client`, {
      headers: {
        'Accept': 'application/javascript',
        'User-Agent': 'Mobile-Test-Client'
      }
    });
    console.log(`   ✓ Vite HMR Status: ${viteResponse.status}`);
    
    if (viteResponse.status === 200) {
      const viteContent = await viteResponse.text();
      if (viteContent.includes('WebSocket') || viteContent.includes('EventSource')) {
        console.log('   ⚠ Vite is trying to establish persistent connections');
      }
    }
  } catch (error) {
    console.log(`   ✗ Vite HMR Error: ${error.message}`);
  }

  // Test 2: Check session cookie behavior
  console.log('\n2. Testing Session Cookie Behavior...');
  try {
    const sessionResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'User-Agent': 'Mobile-Test-Client',
        'Accept': 'application/json'
      }
    });
    
    const cookies = sessionResponse.headers.get('set-cookie');
    console.log(`   Session Status: ${sessionResponse.status}`);
    console.log(`   Cookies Set: ${cookies ? 'Yes' : 'No'}`);
    
    if (cookies) {
      console.log(`   Cookie Details: ${cookies}`);
    }
  } catch (error) {
    console.log(`   ✗ Session Test Error: ${error.message}`);
  }

  // Test 3: Simulate multiple concurrent requests (like multiple devices)
  console.log('\n3. Testing Concurrent Device Simulation...');
  const promises = Array.from({ length: 5 }, (_, i) => 
    fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        'User-Agent': `Device-${i + 1}`,
        'Accept': 'application/json'
      }
    }).then(res => ({ device: i + 1, status: res.status, ok: res.ok }))
    .catch(err => ({ device: i + 1, error: err.message }))
  );

  const results = await Promise.all(promises);
  results.forEach(result => {
    if (result.error) {
      console.log(`   Device ${result.device}: ✗ Error - ${result.error}`);
    } else {
      console.log(`   Device ${result.device}: ${result.ok ? '✓' : '✗'} Status ${result.status}`);
    }
  });

  // Test 4: Check for WebSocket connection attempts
  console.log('\n4. Testing WebSocket Connection Behavior...');
  try {
    const wsTestResponse = await fetch(`${BASE_URL}`, {
      headers: {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
        'User-Agent': 'WebSocket-Test-Client'
      }
    });
    console.log(`   WebSocket Upgrade Response: ${wsTestResponse.status}`);
    
    if (wsTestResponse.status === 101) {
      console.log('   ⚠ WebSocket upgrade successful - may cause conflicts');
    } else if (wsTestResponse.status === 426) {
      console.log('   ✓ WebSocket upgrade required - normal behavior');
    }
  } catch (error) {
    console.log(`   WebSocket Test: ${error.message}`);
  }

  console.log('\n🔍 DIAGNOSIS SUMMARY');
  console.log('===================');
  console.log('If you see multiple "connecting/connected" cycles in your mobile browser,');
  console.log('and Vite HMR is active, this confirms the multi-device conflict theory.');
  console.log('\n📱 TO TEST: Run this while your PC browser tab is OPEN');
  console.log('📱 THEN: Run again after CLOSING the PC browser tab');
  console.log('📱 Compare the results to confirm the conflict.');
}

testSessionConflict().catch(console.error);
