import fetch from 'node-fetch';

const LOCAL_URL = 'http://localhost:5000';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testLocalServer() {
  console.log('Testing local server directly...\n');
  
  try {
    // Test 1: Basic health check
    console.log('1. Testing basic server response...');
    const healthResponse = await fetch(`${LOCAL_URL}/`);
    console.log('Local server status:', healthResponse.status);
    
    // Test 2: GET clients
    console.log('\n2. Testing GET /getClients locally...');
    const getResponse = await fetch(`${LOCAL_URL}/getClients`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    console.log('GET status:', getResponse.status);
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ Local GET SUCCESS:', data.clients?.length, 'clients found');
      
      // Test 3: POST client creation locally
      console.log('\n3. Testing POST /api/gpt/clients locally...');
      const postResponse = await fetch(`${LOCAL_URL}/api/gpt/clients`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: 'Local Test Client',
          email: 'localtest@example.com',
          phone: '555-LOCAL',
          address: '123 Local Test St'
        })
      });

      console.log('POST status:', postResponse.status);
      if (postResponse.ok) {
        const createData = await postResponse.json();
        console.log('✅ Local POST SUCCESS:', createData);
        
        const newClientId = createData.data?.id;
        
        // Test 4: DELETE the test client
        if (newClientId) {
          console.log(`\n4. Testing DELETE /api/gpt/clients/${newClientId} locally...`);
          const deleteResponse = await fetch(`${LOCAL_URL}/api/gpt/clients/${newClientId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('DELETE status:', deleteResponse.status);
          if (deleteResponse.ok) {
            const deleteData = await deleteResponse.json();
            console.log('✅ Local DELETE SUCCESS:', deleteData);
            
            console.log('\n=== LOCAL CLIENT TOOLS TEST SUMMARY ===');
            console.log('✅ GET clients - Working');
            console.log('✅ CREATE client - Working');  
            console.log('✅ DELETE client - Working');
            console.log('\n🎉 All client management tools are fully operational locally!');
          } else {
            const deleteError = await deleteResponse.text();
            console.log('❌ Local DELETE failed:', deleteError);
          }
        }
      } else {
        const postError = await postResponse.text();
        console.log('❌ Local POST failed:', postError);
      }
    } else {
      const getError = await getResponse.text();
      console.log('❌ Local GET failed:', getError);
    }
    
  } catch (error) {
    console.error('Local server test failed:', error.message);
  }
}

testLocalServer();