import https from 'https';

function checkDeployment() {
  console.log('Checking current deployment status...\n');
  
  // Test different endpoints to see what's working
  const endpoints = [
    '/',
    '/health', 
    '/api/business/login',
    '/gpt/clients'
  ];
  
  endpoints.forEach((endpoint, index) => {
    setTimeout(() => {
      const options = {
        hostname: 'bizworx-complete-business-management-api.replit.app',
        port: 443,
        path: endpoint,
        method: 'GET',
        headers: endpoint === '/gpt/clients' ? { 'X-API-Key': 'test' } : {}
      };

      const req = https.request(options, (res) => {
        console.log(`${endpoint}: ${res.statusCode}`);
        if (res.statusCode !== 404) {
          console.log(`  ✅ ${endpoint} is responding`);
        } else {
          console.log(`  ❌ ${endpoint} not found`);
        }
      });
      
      req.on('error', (err) => {
        console.log(`${endpoint}: ERROR - ${err.message}`);
      });
      
      req.setTimeout(5000, () => {
        console.log(`${endpoint}: TIMEOUT`);
        req.destroy();
      });
      
      req.end();
    }, index * 1000);
  });
}

checkDeployment();