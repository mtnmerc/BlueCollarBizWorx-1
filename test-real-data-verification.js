import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function verifyRealData() {
  console.log('Verifying real business data access...\n');
  
  console.log('1. Testing clients endpoint with API key:');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      console.log('\nClient Analysis:');
      console.log('Total clients found:', result.data.length);
      
      result.data.forEach((client, index) => {
        console.log(`Client ${index + 1}:`, {
          name: client.name,
          email: client.email,
          phone: client.phone
        });
      });
      
      // Check for real vs fake data
      const realClients = result.data.filter(c => 
        c.name === 'John Deere' || c.name === 'Christine Vasickanin'
      );
      const fakeClients = result.data.filter(c => 
        c.name === 'John Smith' || c.name === 'Jane Doe' || c.name === 'Bob Johnson'
      );
      
      console.log('\nData verification:');
      console.log('Real clients found:', realClients.length);
      console.log('Fake/test clients found:', fakeClients.length);
      
      if (realClients.length > 0) {
        console.log('✓ Real business data confirmed');
        console.log('Real clients:', realClients.map(c => c.name));
      }
      
      if (fakeClients.length > 0) {
        console.log('⚠ Test data also present');
        console.log('Test clients:', fakeClients.map(c => c.name));
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  console.log('\n2. Testing jobs endpoint with API key:');
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/jobs`, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    console.log('Status:', response.status);
    console.log('Jobs found:', result.data ? result.data.length : 0);
    
    if (result.data && result.data.length > 0) {
      console.log('Sample jobs:');
      result.data.slice(0, 3).forEach((job, index) => {
        console.log(`Job ${index + 1}:`, {
          title: job.title,
          client: job.client,
          status: job.status
        });
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

verifyRealData();