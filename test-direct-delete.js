import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testDirectDelete() {
  console.log('Testing direct DELETE endpoint...\n');
  
  // First, get all clients to see what's available
  console.log('1. Getting current clients...');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log(`Found ${data.data.length} clients:`);
    data.data.forEach(client => {
      console.log(`  - ID: ${client.id}, Name: ${client.name}`);
    });
    
    if (data.data.length === 0) {
      console.log('No clients to delete');
      return;
    }
    
    // Try to delete the first client using direct endpoint
    const clientToDelete = data.data[0];
    console.log(`\n2. Attempting to delete client via /api/gpt/clients/${clientToDelete.id}`);
    
    const deleteResponse = await fetch(`${BASE_URL}/api/gpt/clients/${clientToDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json'
      }
    });
    
    const deleteResult = await deleteResponse.text();
    console.log(`Delete response status: ${deleteResponse.status}`);
    
    if (deleteResponse.status === 200) {
      try {
        const deleteData = JSON.parse(deleteResult);
        console.log(`SUCCESS: ${deleteData.message}`);
        console.log(`Deleted: ${deleteData.data.deletedClientName}`);
      } catch (e) {
        console.log(`Delete succeeded but response parsing failed: ${deleteResult}`);
      }
    } else {
      console.log(`DELETE FAILED: ${deleteResult}`);
    }
    
    // Verify deletion by getting clients again
    console.log('\n3. Verifying deletion...');
    const verifyResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      headers: {
        'Authorization': 'Bearer bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json'
      }
    });
    
    const verifyData = await verifyResponse.json();
    console.log(`Remaining clients: ${verifyData.data.length}`);
    verifyData.data.forEach(client => {
      console.log(`  - ID: ${client.id}, Name: ${client.name}`);
    });
    
    const wasDeleted = !verifyData.data.find(c => c.id === clientToDelete.id);
    console.log(wasDeleted ? 'Deletion verified successfully' : 'ERROR: Client still exists');
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testDirectDelete();