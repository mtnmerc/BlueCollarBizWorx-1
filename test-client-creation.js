import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testClientCreation() {
  console.log('Testing client creation endpoint...\n');
  
  // Test creating a client via the new endpoint
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients/create`, {
      method: 'POST',
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test ChatGPT Client Fix',
        email: 'chatgpt-fix-test@example.com',
        phone: '555-FIXED',
        address: '123 Fixed Street'
      })
    });
    
    console.log('Create client status:', response.status);
    const result = await response.json();
    console.log('Create response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✓ Client creation working correctly');
      
      // Now test getting clients to verify the fix
      const getResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
        method: 'GET',
        headers: {
          'X-API-Key': 'bw_wkad606ephtmbqx7a0f'
        }
      });
      
      console.log('\nGet clients status:', getResponse.status);
      if (getResponse.status === 200) {
        console.log('✓ Client listing working correctly');
        console.log('ChatGPT integration should now work without 400 errors');
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testClientCreation();