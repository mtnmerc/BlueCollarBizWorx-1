import { spawn } from 'child_process';
import http from 'http';

// Start server and test API key endpoint
function startServerAndTest() {
  console.log('Starting server...');
  
  const server = spawn('tsx', ['server/index.ts'], {
    stdio: ['inherit', 'pipe', 'pipe']
  });

  server.stdout.on('data', (data) => {
    console.log('STDOUT:', data.toString());
    if (data.toString().includes('Server running on port 5000')) {
      console.log('Server started, testing API key endpoint...');
      setTimeout(testAPIKey, 2000);
    }
  });

  server.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString());
  });

  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });

  server.on('error', (err) => {
    console.log('Server error:', err);
  });

  function testAPIKey() {
    const postData = JSON.stringify({});
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/business/api-key',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('Making request to:', options);
    
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Response body:', data);
        
        if (res.statusCode === 401) {
          console.log('\n=== TESTING WITH LOGIN FIRST ===');
          testWithLogin();
        } else {
          server.kill();
          process.exit(0);
        }
      });
    });

    req.on('error', (err) => {
      console.log('Request error:', err);
      server.kill();
      process.exit(1);
    });

    req.write(postData);
    req.end();
  }

  function testWithLogin() {
    // First login to get session
    const loginData = JSON.stringify({
      email: 'admin@flatlineearthworks.com',
      password: 'password123'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };

    console.log('Logging in first...');
    
    const loginReq = http.request(loginOptions, (res) => {
      console.log(`Login Status: ${res.statusCode}`);
      
      const cookies = res.headers['set-cookie'];
      console.log('Login cookies:', cookies);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('Login response:', data);
        
        if (res.statusCode === 200 && cookies) {
          // Now test API key endpoint with session
          testAPIKeyWithSession(cookies[0]);
        } else {
          console.log('Login failed');
          server.kill();
          process.exit(1);
        }
      });
    });

    loginReq.on('error', (err) => {
      console.log('Login error:', err);
      server.kill();
      process.exit(1);
    });

    loginReq.write(loginData);
    loginReq.end();
  }

  function testAPIKeyWithSession(cookie) {
    const postData = JSON.stringify({});
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/business/api-key',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Cookie': cookie
      }
    };

    console.log('Testing API key endpoint with session...');
    
    const req = http.request(options, (res) => {
      console.log(`API Key Status: ${res.statusCode}`);
      console.log(`API Key Headers:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('API Key Response:', data);
        
        // Test if it's valid JSON
        try {
          const parsed = JSON.parse(data);
          console.log('✓ Valid JSON response');
          if (parsed.success && parsed.data && parsed.data.apiKey) {
            console.log('✓ API key generated successfully');
          } else if (parsed.error) {
            console.log('✗ API generation failed:', parsed.error);
          }
        } catch (e) {
          console.log('✗ Invalid JSON response:', e.message);
          console.log('Raw response:', data);
        }
        
        server.kill();
        process.exit(0);
      });
    });

    req.on('error', (err) => {
      console.log('API Key request error:', err);
      server.kill();
      process.exit(1);
    });

    req.write(postData);
    req.end();
  }
}

startServerAndTest();