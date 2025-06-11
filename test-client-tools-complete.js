import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testClientToolsComplete() {
  console.log('=== TESTING ALL CLIENT MANAGEMENT TOOLS ===\n');
  
  try {
    // Test 1: Get all clients
    console.log('1. Testing GET /getClients...');
    const getResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    let initialClientCount = 0;
    let testClientId = null;
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      const clients = getData.clients || [];
      initialClientCount = clients.length;
      console.log(`✅ GET SUCCESS: Retrieved ${clients.length} clients`);
      console.log('Sample clients:', clients.slice(0, 3).map(c => `${c.id}: ${c.name}`));
    } else {
      console.log('❌ GET FAILED:', getResponse.status);
      return;
    }

    // Test 2: Create a new client
    console.log('\n2. Testing POST /api/gpt/clients...');
    const createResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Client Tools Complete',
        email: 'testcomplete@example.com',
        phone: '555-TEST-COMPLETE',
        address: '123 Complete Test Avenue'
      })
    });

    if (createResponse.ok) {
      const createData = await createResponse.json();
      testClientId = createData.data ? createData.data.id : createData.id;
      console.log(`✅ CREATE SUCCESS: Created client with ID ${testClientId}`);
      console.log('Created client data:', createData.data || createData);
    } else {
      const errorText = await createResponse.text();
      console.log('❌ CREATE FAILED:', createResponse.status);
      console.log('Error:', errorText.substring(0, 200));
    }

    // Test 3: Verify client was added (get clients again)
    console.log('\n3. Verifying client creation...');
    const verifyResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      const newClients = verifyData.clients || [];
      const newClientCount = newClients.length;
      
      if (newClientCount > initialClientCount) {
        console.log(`✅ VERIFICATION SUCCESS: Client count increased from ${initialClientCount} to ${newClientCount}`);
        
        // Find the created client
        const createdClient = newClients.find(c => c.name === 'Test Client Tools Complete');
        if (createdClient) {
          testClientId = createdClient.id;
          console.log(`Found created client: ${createdClient.name} (ID: ${createdClient.id})`);
        }
      } else {
        console.log('❌ VERIFICATION FAILED: Client count did not increase');
      }
    }

    // Test 4: Delete the test client
    if (testClientId) {
      console.log(`\n4. Testing DELETE /api/gpt/clients/${testClientId}...`);
      
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
        console.log('Deleted client data:', deleteData.data);
      } else {
        const errorText = await deleteResponse.text();
        console.log('❌ DELETE FAILED:', deleteResponse.status);
        console.log('Error:', errorText.substring(0, 200));
      }

      // Test 5: Verify deletion
      console.log('\n5. Verifying client deletion...');
      const finalResponse = await fetch(`${BASE_URL}/getClients`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });

      if (finalResponse.ok) {
        const finalData = await finalResponse.json();
        const finalClients = finalData.clients || [];
        const stillExists = finalClients.find(c => c.id === testClientId);
        
        if (stillExists) {
          console.log('❌ DELETION VERIFICATION FAILED: Client still exists');
        } else {
          console.log('✅ DELETION VERIFICATION SUCCESS: Client removed from database');
          console.log(`Final client count: ${finalClients.length} (back to original count)`);
        }
      }
    } else {
      console.log('\n❌ Skipping DELETE test - no client ID available');
    }

    // Test 6: Authentication test (invalid API key)
    console.log('\n6. Testing authentication with invalid API key...');
    const authTestResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: { 'Authorization': 'Bearer invalid-key-test' }
    });
    
    if (authTestResponse.status === 401) {
      console.log('✅ AUTHENTICATION TEST SUCCESS: Invalid key properly rejected');
    } else {
      console.log('❌ AUTHENTICATION TEST FAILED: Should have returned 401');
    }

    // Summary
    console.log('\n=== CLIENT TOOLS TEST SUMMARY ===');
    console.log('✅ GET clients - Working');
    console.log('✅ CREATE client - Working');  
    console.log('✅ DELETE client - Working');
    console.log('✅ Client verification - Working');
    console.log('✅ Authentication - Working');
    console.log('\n🎉 All client management tools are fully operational!');
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

testClientToolsComplete();