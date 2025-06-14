#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');

function testConnection(host, port, path = '/') {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        success: false,
        error: 'Connection timeout'
      });
    });

    req.end();
  });
}

async function diagnoseConnectivity() {
  console.log('🔍 Diagnosing rollback connectivity issues...\n');

  // Test localhost connections
  console.log('Testing localhost connections:');
  const localhostTests = [
    { host: '127.0.0.1', port: 5000, path: '/api/health' },
    { host: 'localhost', port: 5000, path: '/api/health' },
    { host: '127.0.0.1', port: 5000, path: '/' },
  ];

  for (const test of localhostTests) {
    const result = await testConnection(test.host, test.port, test.path);
    console.log(`  ${test.host}:${test.port}${test.path} - ${result.success ? '✅ Success' : '❌ Failed: ' + result.error}`);
  }

  // Test external interface binding
  console.log('\nTesting external interface binding:');
  const externalTests = [
    { host: '0.0.0.0', port: 5000, path: '/api/health' },
  ];

  for (const test of externalTests) {
    const result = await testConnection(test.host, test.port, test.path);
    console.log(`  ${test.host}:${test.port}${test.path} - ${result.success ? '✅ Success' : '❌ Failed: ' + result.error}`);
  }

  // Check environment variables
  console.log('\nEnvironment variables:');
  console.log(`  PORT: ${process.env.PORT || 'undefined'}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`  REPLIT_CLUSTER: ${process.env.REPLIT_CLUSTER || 'undefined'}`);
  console.log(`  REPLIT_DEV_DOMAIN: ${process.env.REPLIT_DEV_DOMAIN || 'undefined'}`);

  // Check process list for conflicts
  console.log('\nChecking for process conflicts...');
  try {
    const ps = spawn('ps', ['aux']);
    let output = '';
    ps.stdout.on('data', (data) => output += data);
    ps.on('close', () => {
      const lines = output.split('\n').filter(line => 
        line.includes('node') && (line.includes('5000') || line.includes('server'))
      );
      if (lines.length > 0) {
        console.log('  Server processes found:');
        lines.forEach(line => console.log(`    ${line.trim()}`));
      } else {
        console.log('  No conflicting processes detected');
      }
    });
  } catch (error) {
    console.log(`  Process check failed: ${error.message}`);
  }
}

diagnoseConnectivity();