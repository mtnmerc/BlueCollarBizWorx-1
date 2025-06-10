// Simple test to debug the GPT endpoint issues
const { storage } = require('./server/storage.js');

async function testStorageMethods() {
  console.log('Testing storage methods...');
  
  try {
    // Test getting business by API key
    console.log('1. Testing getBusinessByApiKey...');
    const business = await storage.getBusinessByApiKey('bw_wkad606ephtmbqx7a0f');
    console.log('Business found:', business ? `ID: ${business.id}, Name: ${business.name}` : 'Not found');
    
    if (business) {
      // Test getting clients
      console.log('2. Testing getClientsByBusiness...');
      const clients = await storage.getClientsByBusiness(business.id);
      console.log('Clients found:', clients.length);
      
      // Test getting jobs
      console.log('3. Testing getJobsByBusiness...');
      const jobs = await storage.getJobsByBusiness(business.id);
      console.log('Jobs found:', jobs.length);
    }
  } catch (error) {
    console.error('Storage test error:', error);
  }
}

testStorageMethods();