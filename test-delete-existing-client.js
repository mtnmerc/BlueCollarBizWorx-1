import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testDeleteExistingClient() {
  try {
    console.log('Testing DELETE functionality with existing test client...\n');
    
    // Get current clients
    const clientsResponse = await fetch(`${BASE_URL}/getClients`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    const clientsData = await clientsResponse.json();
    const clients = clientsData.clients || [];
    
    // Find a test client to delete (avoid deleting real business clients)
    const testClient = clients.find(c => 
      c.name.toLowerCase().includes('test') || 
      c.name.toLowerCase().includes('chatgpt') ||
      c.id > 8  // Any client added after the original 8
    );
    
    if (!testClient) {
      console.log('No test clients found. Using highest ID client for deletion test...');
      // Use the client with highest ID (likely a test client)
      const highestClient = clients.reduce((max, client) => 
        client.id > max.id ? client : max, clients[0]);
      
      if (highestClient && highestClient.id > 8) {
        console.log(`Testing DELETE with client: ${highestClient.name} (ID: ${highestClient.id})`);
        await performDelete(highestClient.id, highestClient.name);
      } else {
        console.log('No suitable test clients found for deletion');
      }
    } else {
      console.log(`Testing DELETE with client: ${testClient.name} (ID: ${testClient.id})`);
      await performDelete(testClient.id, testClient.name);
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

async function performDelete(clientId, clientName) {
  // Attempt DELETE
  const deleteResponse = await fetch(`${BASE_URL}/api/gpt/clients/${clientId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
  
  console.log(`DELETE response status: ${deleteResponse.status}`);
  
  if (deleteResponse.ok) {
    const deleteResult = await deleteResponse.json();
    console.log('✅ DELETE SUCCESS:', deleteResult);
  } else {
    const errorText = await deleteResponse.text();
    console.log('❌ DELETE FAILED:', errorText.substring(0, 300));
  }
  
  // Verify deletion
  console.log('\nVerifying deletion...');
  const verifyResponse = await fetch(`${BASE_URL}/getClients`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  
  if (verifyResponse.ok) {
    const verifyData = await verifyResponse.json();
    const remainingClients = verifyData.clients || [];
    const stillExists = remainingClients.find(c => c.id === clientId);
    
    if (stillExists) {
      console.log('❌ Client still exists after deletion attempt');
    } else {
      console.log('✅ Client successfully removed from database');
      console.log(`Remaining clients: ${remainingClients.length}`);
    }
  }
}

testDeleteExistingClient();