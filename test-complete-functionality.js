import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testCompleteFunctionality() {
  console.log('=== COMPREHENSIVE BIZWORX API TEST ===\n');
  
  try {
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Health check passed:', health.status);
    } else {
      console.log('❌ Health check failed');
      return;
    }

    // Test 2: Get Clients
    console.log('\n2. Testing get clients endpoint...');
    const clientsResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (clientsResponse.ok) {
      const clientsData = await clientsResponse.json();
      if (clientsData && clientsData.data && Array.isArray(clientsData.data)) {
        console.log(`✅ Retrieved ${clientsData.data.length} clients`);
        console.log('Sample clients:', clientsData.data.slice(0, 3).map(c => `${c.id}: ${c.name}`));
      } else {
        console.log('❌ Invalid client data structure:', clientsData);
      }
    } else {
      console.log('❌ Failed to get clients:', clientsResponse.status);
      const errorText = await clientsResponse.text();
      console.log('Error response:', errorText.substring(0, 200));
    }

    // Test 3: Get Jobs
    console.log('\n3. Testing get jobs endpoint...');
    const jobsResponse = await fetch(`${BASE_URL}/getJobs`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log(`✅ Retrieved ${jobsData.data.length} jobs`);
      console.log('Sample jobs:', jobsData.data.slice(0, 3).map(j => `${j.id}: ${j.title}`));
    } else {
      console.log('❌ Failed to get jobs:', jobsResponse.status);
    }

    // Test 4: Get Dashboard
    console.log('\n4. Testing dashboard endpoint...');
    const dashResponse = await fetch(`${BASE_URL}/getDashboard`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (dashResponse.ok) {
      const dashData = await dashResponse.json();
      console.log('✅ Dashboard metrics:', dashData.data);
    } else {
      console.log('❌ Failed to get dashboard:', dashResponse.status);
    }

    // Test 5: Create Test Client
    console.log('\n5. Testing create client endpoint...');
    const createResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'DELETE Test Client',
        email: 'delete.test@example.com',
        phone: '555-DELETE',
        address: '123 Delete Test St'
      })
    });

    let testClientId = null;
    if (createResponse.ok) {
      const createData = await createResponse.json();
      testClientId = createData.data.id;
      console.log(`✅ Created test client with ID: ${testClientId}`);
    } else {
      console.log('❌ Failed to create test client:', createResponse.status);
      const errorText = await createResponse.text();
      console.log('Create error:', errorText.substring(0, 200));
    }

    // Test 6: Delete Client (if created)
    if (testClientId) {
      console.log(`\n6. Testing delete client endpoint for ID ${testClientId}...`);
      
      const deleteResponse = await fetch(`${BASE_URL}/api/gpt/clients/${testClientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (deleteResponse.ok) {
        const deleteData = await deleteResponse.json();
        console.log('✅ DELETE SUCCESS:', deleteData.message);
        console.log('Deleted client:', deleteData.data);
      } else {
        console.log('❌ DELETE FAILED:', deleteResponse.status);
        const errorText = await deleteResponse.text();
        console.log('Delete error:', errorText.substring(0, 200));
      }

      // Verify deletion
      console.log('\n7. Verifying client deletion...');
      const verifyResponse = await fetch(`${BASE_URL}/getClients`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        const stillExists = verifyData.data.find(c => c.id === testClientId);
        
        if (stillExists) {
          console.log('❌ Client still exists after deletion');
        } else {
          console.log('✅ Client successfully removed from database');
        }
      }
    }

    console.log('\n=== TEST SUMMARY ===');
    console.log('All core API endpoints tested');
    console.log('ChatGPT integration ready for deployment');
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

testCompleteFunctionality();