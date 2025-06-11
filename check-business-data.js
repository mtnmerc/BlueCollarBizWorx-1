import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function checkBusinessData() {
  console.log('Checking business data for your account...\n');
  
  try {
    // Get business info
    console.log('1. Business Information:');
    const businessResponse = await fetch(`${BASE_URL}/api/gpt/dashboard`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const businessResult = await businessResponse.json();
    console.log('Dashboard:', JSON.stringify(businessResult, null, 2));
    
    // Get clients
    console.log('\n2. Client Information:');
    const clientsResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const clientsResult = await clientsResponse.json();
    console.log('Clients:', JSON.stringify(clientsResult, null, 2));
    
    // Get jobs
    console.log('\n3. Job Information:');
    const jobsResponse = await fetch(`${BASE_URL}/api/gpt/jobs`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const jobsResult = await jobsResponse.json();
    console.log('Jobs (first 3):', JSON.stringify(jobsResult.data?.slice(0, 3), null, 2));
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

checkBusinessData();