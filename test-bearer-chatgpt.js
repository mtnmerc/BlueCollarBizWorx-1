import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testBearerForChatGPT() {
  console.log('Testing Bearer authentication for ChatGPT Custom GPT...\n');
  
  try {
    // Test the debug endpoint first
    console.log('1. Testing debug endpoint...');
    const debugResponse = await fetch(`${BASE_URL}/api/gpt/debug`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const debugResult = await debugResponse.json();
    console.log(`Debug Status: ${debugResponse.status}`);
    console.log('Debug Response:', JSON.stringify(debugResult, null, 2));
    
    // Test dashboard endpoint
    console.log('\n2. Testing dashboard endpoint...');
    const dashboardResponse = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const dashboardResult = await dashboardResponse.json();
    console.log(`Dashboard Status: ${dashboardResponse.status}`);
    console.log('Dashboard Response:', JSON.stringify(dashboardResult, null, 2));
    
    // Test client listing
    console.log('\n3. Testing client listing...');
    const clientsResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const clientsResult = await clientsResponse.json();
    console.log(`Clients Status: ${clientsResponse.status}`);
    console.log(`Total clients: ${clientsResult.data?.length || 0}`);
    
    if (dashboardResponse.status === 200 && clientsResponse.status === 200) {
      console.log('\n✅ Bearer authentication is working perfectly for ChatGPT Custom GPT!');
      console.log('🎉 All endpoints are ready for voice commands through ChatGPT!');
    } else {
      console.log('\n❌ Authentication issues detected');
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testBearerForChatGPT();