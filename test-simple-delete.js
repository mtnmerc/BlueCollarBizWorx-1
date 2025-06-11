import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testSimpleDelete() {
  try {
    console.log('Testing simple DELETE endpoint...');
    
    // First get all clients
    const clientsResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f'
      }
    });
    
    const clientsData = await clientsResponse.json();
    console.log(`Found ${clientsData.data.length} clients`);
    
    if (clientsData.data.length === 0) {
      console.log('No clients to delete');
      return;
    }
    
    // Find a test client to delete
    const testClient = clientsData.data.find(c => c.name.includes('Test') || c.name.includes('ChatGPT'));
    if (!testClient) {
      console.log('No test clients found to delete safely');
      return;
    }
    
    console.log(`Attempting to delete client: ${testClient.name} (ID: ${testClient.id})`);
    
    // Try DELETE request
    const deleteResponse = await fetch(`${BASE_URL}/api/gpt/clients/${testClient.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Delete response status: ${deleteResponse.status}`);
    
    if (deleteResponse.ok) {
      const result = await deleteResponse.json();
      console.log('DELETE SUCCESS:', result);
    } else {
      const error = await deleteResponse.text();
      console.log('DELETE FAILED:', error);
    }
    
    // Verify deletion
    const verifyResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f'
      }
    });
    
    const verifyData = await verifyResponse.json();
    const stillExists = verifyData.data.find(c => c.id === testClient.id);
    
    if (stillExists) {
      console.log('ERROR: Client still exists after deletion');
    } else {
      console.log('SUCCESS: Client successfully deleted');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testSimpleDelete();