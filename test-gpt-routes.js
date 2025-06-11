import https from 'https';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bluecollarbizworx.replit.app';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'bluecollarbizworx.replit.app',
      port: 443,
      path: path,
      method: method,
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testRoutes() {
  console.log('=== Testing GPT Routes ===\n');

  // Test 1: GET Estimates (should return detailed data with items)
  console.log('1. Testing GET /api/gpt/estimates');
  try {
    const result = await makeRequest('/api/gpt/estimates');
    console.log('Status:', result.status);
    console.log('Success:', result.data.success);
    console.log('Message:', result.data.message);
    
    if (result.data.data && result.data.data.length > 0) {
      const firstEstimate = result.data.data[0];
      console.log('First estimate has items:', Array.isArray(firstEstimate.items));
      console.log('Items count:', firstEstimate.items ? firstEstimate.items.length : 0);
      console.log('Has clientName:', !!firstEstimate.clientName);
      console.log('Data source verification:', !!result.data.businessVerification);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: GET Invoices (should return detailed data)
  console.log('2. Testing GET /api/gpt/invoices');
  try {
    const result = await makeRequest('/api/gpt/invoices');
    console.log('Status:', result.status);
    console.log('Success:', result.data.success);
    console.log('Message:', result.data.message);
    console.log('Invoices count:', result.data.data ? result.data.data.length : 0);
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: GET Clients
  console.log('3. Testing GET /api/gpt/clients');
  try {
    const result = await makeRequest('/api/gpt/clients');
    console.log('Status:', result.status);
    console.log('Success:', result.data.success);
    console.log('Clients count:', result.data.data ? result.data.data.length : 0);
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Test POST route (create client - should work)
  console.log('4. Testing POST /api/gpt/clients (create test client)');
  try {
    const testClient = {
      name: 'Test Route Client',
      email: 'test@routetest.com',
      phone: '555-TEST-ROUTE'
    };
    
    const result = await makeRequest('/api/gpt/clients', 'POST', testClient);
    console.log('Status:', result.status);
    console.log('Success:', result.data.success);
    console.log('Message:', result.data.message);
    
    if (result.data.success && result.data.data) {
      console.log('Created client ID:', result.data.data.id);
      
      // Clean up - delete the test client
      const deleteResult = await makeRequest(`/api/gpt/clients/${result.data.data.id}`, 'DELETE');
      console.log('Cleanup delete status:', deleteResult.status);
    }
  } catch (error) {
    console.log('Error:', error.message);
  }

  console.log('\n=== Route Testing Complete ===');
}

testRoutes();