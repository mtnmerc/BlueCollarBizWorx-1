
import { storage } from './server/storage.js';

async function createTestData() {
  // You'll need to replace this with your actual business ID
  const businessId = 1; // Replace with your business ID
  
  const testClients = [
    {
      businessId,
      name: "Test Client 1",
      email: "test1@example.com",
      phone: "555-0101",
      address: "123 Test St, Test City, TC 12345"
    },
    {
      businessId,
      name: "Test Client 2", 
      email: "test2@example.com",
      phone: "555-0102",
      address: "456 Sample Ave, Sample City, SC 67890"
    }
  ];

  for (const clientData of testClients) {
    try {
      const client = await storage.createClient(clientData);
      console.log('Created test client:', client.name);
    } catch (error) {
      console.error('Error creating client:', error);
    }
  }
}

createTestData();
