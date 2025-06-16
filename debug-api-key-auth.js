// Direct test of the storage authentication
import { storage } from './server/storage.js';

async function debugApiKeyAuth() {
  console.log('=== DIRECT STORAGE API KEY TEST ===\n');
  
  try {
    // Test the known API key directly
    console.log('Testing known API key: bw_wkad606ephtmbqx7a0f');
    const business1 = await storage.getBusinessByApiKey('bw_wkad606ephtmbqx7a0f');
    
    if (business1) {
      console.log('✅ Found business:', business1.name);
      console.log('Business ID:', business1.id);
      console.log('API Key matches:', business1.apiKey === 'bw_wkad606ephtmbqx7a0f');
    } else {
      console.log('❌ Business not found for this API key');
      
      // Check if any businesses exist
      console.log('\nChecking all businesses...');
      const allBusinesses = await storage.getAllBusinesses();
      console.log(`Found ${allBusinesses?.length || 0} businesses total`);
      
      if (allBusinesses && allBusinesses.length > 0) {
        allBusinesses.forEach((biz, i) => {
          console.log(`  ${i+1}. ${biz.name} - API Key: ${biz.apiKey || 'None'}`);
        });
      }
    }
    
    // Test if there are any API keys at all
    console.log('\nTesting getBusinessByApiKey method directly...');
    
  } catch (error) {
    console.error('Storage test failed:', error);
    console.error('Stack:', error.stack);
  }
}

debugApiKeyAuth();