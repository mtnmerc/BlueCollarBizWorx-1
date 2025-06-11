import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testChatGPTExactFormat() {
  console.log('Testing exact ChatGPT authorization format...\n');
  
  try {
    // Test with Bearer prefix as ChatGPT sends it
    console.log('1. Testing with Bearer prefix (ChatGPT format)...');
    const response = await fetch(`${BASE_URL}/api/gpt/debug`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ChatGPT/1.0'
      }
    });
    
    const result = await response.json();
    console.log(`Status: ${response.status}`);
    console.log('Authorization header received:', result.headers?.authorization);
    
    if (response.status === 200) {
      console.log('✅ Bearer format authentication working!');
      
      // Test actual endpoint
      console.log('\n2. Testing dashboard with Bearer format...');
      const dashboardResponse = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ChatGPT/1.0'
        }
      });
      
      const dashboardResult = await dashboardResponse.json();
      console.log(`Dashboard Status: ${dashboardResponse.status}`);
      
      if (dashboardResponse.status === 200) {
        console.log('✅ ChatGPT Bearer authentication fully working!');
        console.log('Dashboard data:', dashboardResult.data);
      } else {
        console.log('❌ Dashboard endpoint failed:', dashboardResult);
      }
    } else {
      console.log('❌ Bearer authentication failed:', result);
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testChatGPTExactFormat();