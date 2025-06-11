import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function checkDataStatus() {
  console.log('=== CHECKING DATA STATUS ===\n');
  
  try {
    // Check clients
    const clientsResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    if (clientsResponse.ok) {
      const clientsData = await clientsResponse.json();
      console.log(`Clients found: ${clientsData.data?.length || 0}`);
      if (clientsData.data?.length > 0) {
        console.log('Sample client names:');
        clientsData.data.slice(0, 3).forEach(client => {
          console.log(`  - ${client.name} (${client.email})`);
        });
      }
    } else {
      console.log('❌ Clients endpoint failed');
    }
    
    // Check jobs
    const jobsResponse = await fetch(`${BASE_URL}/api/gpt/jobs`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log(`Jobs found: ${jobsData.data?.length || 0}`);
      if (jobsData.data?.length > 0) {
        console.log('Sample job descriptions:');
        jobsData.data.slice(0, 3).forEach(job => {
          console.log(`  - ${job.description} (${job.status})`);
        });
      }
    } else {
      console.log('❌ Jobs endpoint failed');
    }
    
    // Check dashboard/business info
    const dashboardResponse = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      headers: { 'X-API-Key': API_KEY }
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log(`Business name: ${dashboardData.data?.business?.name || 'Unknown'}`);
      console.log(`API Key status: ${dashboardData.data?.business?.apiKey ? 'Active' : 'Missing'}`);
    } else {
      console.log('❌ Dashboard endpoint failed');
    }
    
  } catch (error) {
    console.log(`❌ Error checking data: ${error.message}`);
  }
  
  console.log('\n=== DATA STATUS CHECK COMPLETE ===');
}

checkDataStatus();