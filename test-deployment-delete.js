import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testDeploymentDelete() {
  try {
    console.log('Testing DELETE client on deployed application...');
    
    // Test health endpoint first
    const healthResponse = await fetch(`${BASE_URL}/health`);
    console.log(`Health check status: ${healthResponse.status}`);
    
    if (healthResponse.status === 200) {
      const healthData = await healthResponse.json();
      console.log('Health check passed:', healthData);
    }
    
    // Get clients with proper error handling
    console.log('\n1. Getting current clients...');
    const clientsResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Clients response status: ${clientsResponse.status}`);
    
    if (!clientsResponse.ok) {
      const errorText = await clientsResponse.text();
      console.log('Clients fetch failed:', errorText.substring(0, 200));
      return;
    }
    
    const clientsData = await clientsResponse.json();
    console.log(`Found ${clientsData.data.length} clients`);
    
    // Find test client to delete
    const testClient = clientsData.data.find(c => 
      c.name.toLowerCase().includes('test') || 
      c.name.toLowerCase().includes('chatgpt') ||
      c.id > 8  // Any client added after the original 8
    );
    
    if (!testClient) {
      console.log('No test clients found - creating one first');
      
      // Create a test client
      const createResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'DELETE Test Client',
          email: 'delete.test@example.com',
          phone: '555-DELETE',
          address: '123 Delete St'
        })
      });
      
      if (!createResponse.ok) {
        console.log('Failed to create test client');
        return;
      }
      
      const createdClient = await createResponse.json();
      console.log('Created test client:', createdClient);
      
      // Use the created client for deletion
      testClient = createdClient.data;
    }
    
    console.log(`\n2. Attempting to delete client: ${testClient.name} (ID: ${testClient.id})`);
    
    // Test DELETE endpoint
    const deleteResponse = await fetch(`${BASE_URL}/api/gpt/clients/${testClient.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Delete response status: ${deleteResponse.status}`);
    
    if (deleteResponse.ok) {
      const deleteResult = await deleteResponse.json();
      console.log('DELETE SUCCESS:', deleteResult);
    } else {
      const errorText = await deleteResponse.text();
      console.log('DELETE FAILED:', errorText.substring(0, 500));
      
      // Try alternative endpoint
      console.log('\n3. Trying alternative DELETE endpoint...');
      const altDeleteResponse = await fetch(`${BASE_URL}/deleteClient/${testClient.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Alternative delete status: ${altDeleteResponse.status}`);
      if (altDeleteResponse.ok) {
        const altResult = await altDeleteResponse.json();
        console.log('ALTERNATIVE DELETE SUCCESS:', altResult);
      } else {
        const altError = await altDeleteResponse.text();
        console.log('ALTERNATIVE DELETE FAILED:', altError.substring(0, 500));
      }
    }
    
    // Verify deletion
    console.log('\n4. Verifying deletion...');
    const verifyResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f'
      }
    });
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      const stillExists = verifyData.data.find(c => c.id === testClient.id);
      
      if (stillExists) {
        console.log('❌ Client still exists after deletion attempt');
      } else {
        console.log('✅ Client successfully deleted');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testDeploymentDelete();