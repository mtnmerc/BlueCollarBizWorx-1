import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testChatGPTAuthenticData() {
  console.log('Testing ChatGPT authentic data access...\n');
  
  // Test 1: Dashboard with enhanced verification
  console.log('1. Testing enhanced dashboard endpoint:');
  try {
    const response1 = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      headers: {
        'User-Agent': 'ChatGPT-User/1.0',
        'Content-Type': 'application/json'
      }
    });
    
    const result1 = await response1.json();
    console.log('Status:', response1.status);
    console.log('Business Verification:', result1.businessVerification || 'Not available');
    console.log('Message:', result1.message);
    console.log('Data:', result1.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n2. Testing enhanced clients endpoint:');
  try {
    const response2 = await fetch(`${BASE_URL}/api/gpt/clients`, {
      headers: {
        'User-Agent': 'ChatGPT-User/1.0',
        'Content-Type': 'application/json'
      }
    });
    
    const result2 = await response2.json();
    console.log('Status:', response2.status);
    console.log('Message:', result2.message);
    
    if (result2.dataVerification) {
      console.log('Data Verification:');
      console.log('- Business Name:', result2.dataVerification.businessName);
      console.log('- Total Clients:', result2.dataVerification.totalClients);
      console.log('- Real Clients Found:', result2.dataVerification.realClientsFound);
      console.log('- Real Client Names:', result2.dataVerification.realClientNames);
    }
    
    if (result2.data && result2.data.length > 0) {
      console.log('\nAuthentic client data sample:');
      result2.data.slice(0, 3).forEach((client, index) => {
        console.log(`Client ${index + 1}: ${client.name} (${client.email})`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n3. Testing enhanced jobs endpoint:');
  try {
    const response3 = await fetch(`${BASE_URL}/api/gpt/jobs`, {
      headers: {
        'User-Agent': 'ChatGPT-User/1.0',
        'Content-Type': 'application/json'
      }
    });
    
    const result3 = await response3.json();
    console.log('Status:', response3.status);
    console.log('Message:', result3.message);
    
    if (result3.businessVerification) {
      console.log('Business Verification:');
      console.log('- Business Name:', result3.businessVerification.businessName);
      console.log('- Total Jobs:', result3.businessVerification.totalJobs);
      console.log('- Data Source:', result3.businessVerification.dataSource);
    }
    
    if (result3.data && result3.data.length > 0) {
      console.log('\nAuthentic job data sample:');
      result3.data.slice(0, 3).forEach((job, index) => {
        console.log(`Job ${index + 1}: "${job.title}" for ${job.client} (${job.status})`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n4. Testing with explicit API key:');
  try {
    const response4 = await fetch(`${BASE_URL}/api/gpt/clients`, {
      headers: {
        'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
        'User-Agent': 'ChatGPT-User/1.0',
        'Content-Type': 'application/json'
      }
    });
    
    const result4 = await response4.json();
    console.log('Status:', response4.status);
    console.log('Message:', result4.message);
    
    // Verify authentic clients are present
    if (result4.data) {
      const johnDeere = result4.data.find(c => c.name === 'John Deere');
      const christine = result4.data.find(c => c.name === 'Christine Vasickanin');
      
      console.log('\nAuthentic client verification:');
      console.log('- John Deere found:', johnDeere ? 'YES' : 'NO');
      console.log('- Christine Vasickanin found:', christine ? 'YES' : 'NO');
      
      if (johnDeere) {
        console.log('- John Deere details:', { email: johnDeere.email, phone: johnDeere.phone });
      }
      if (christine) {
        console.log('- Christine details:', { email: christine.email, address: christine.address });
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testChatGPTAuthenticData();