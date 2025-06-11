import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function checkBusinessData() {
  console.log('=== CHECKING BUSINESS DATA DIRECTLY ===\n');
  
  try {
    // Test direct API key lookup
    const testResponse = await fetch(`${BASE_URL}/api/gpt/test`, {
      headers: { 'X-API-Key': 'bw_wkad606ephtmbqx7a0f' }
    });
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('API Key Test Result:');
      console.log(JSON.stringify(testData, null, 2));
    } else {
      console.log(`API Key test failed: ${testResponse.status}`);
      const errorText = await testResponse.text();
      console.log('Error response:', errorText.substring(0, 200));
    }
    
    // Check what dashboard returns in detail
    const dashboardResponse = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      headers: { 'X-API-Key': 'bw_wkad606ephtmbqx7a0f' }
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('\nDashboard Response:');
      console.log(JSON.stringify(dashboardData, null, 2));
    } else {
      console.log(`Dashboard failed: ${dashboardResponse.status}`);
    }
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

checkBusinessData();