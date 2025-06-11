import http from 'http';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'http://localhost:5000';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'User-Agent': 'ChatGPT/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testCleanGPTRoutes() {
  console.log('=== TESTING CLEAN GPT ROUTES ===');
  
  try {
    // Test estimates endpoint
    console.log('\n1. Testing /api/gpt/estimates...');
    const estimatesResult = await makeRequest('/api/gpt/estimates');
    console.log('Status:', estimatesResult.status);
    console.log('Has businessVerification:', !!estimatesResult.data?.businessVerification);
    console.log('Has items array:', Array.isArray(estimatesResult.data?.data?.[0]?.items));
    
    if (estimatesResult.data?.data?.[0]) {
      console.log('First estimate structure:', Object.keys(estimatesResult.data.data[0]));
    }

    // Test clients endpoint  
    console.log('\n2. Testing /api/gpt/clients...');
    const clientsResult = await makeRequest('/api/gpt/clients');
    console.log('Status:', clientsResult.status);
    console.log('Has businessVerification:', !!clientsResult.data?.businessVerification);
    console.log('Data count:', clientsResult.data?.data?.length || 0);

    // Test invoices endpoint
    console.log('\n3. Testing /api/gpt/invoices...');
    const invoicesResult = await makeRequest('/api/gpt/invoices');
    console.log('Status:', invoicesResult.status);
    console.log('Has businessVerification:', !!invoicesResult.data?.businessVerification);
    console.log('Has items array:', Array.isArray(invoicesResult.data?.data?.[0]?.items));

    // Test jobs endpoint
    console.log('\n4. Testing /api/gpt/jobs...');
    const jobsResult = await makeRequest('/api/gpt/jobs');
    console.log('Status:', jobsResult.status);
    console.log('Has businessVerification:', !!jobsResult.data?.businessVerification);
    console.log('Data count:', jobsResult.data?.data?.length || 0);

    console.log('\n=== ALL TESTS COMPLETED ===');
    
    // Summary
    const allHaveVerification = [estimatesResult, clientsResult, invoicesResult, jobsResult]
      .every(result => result.data?.businessVerification);
    
    console.log('\n✅ All endpoints have businessVerification:', allHaveVerification);
    
    return allHaveVerification;

  } catch (error) {
    console.error('Test error:', error.message);
    return false;
  }
}

testCleanGPTRoutes().then(success => {
  process.exit(success ? 0 : 1);
});