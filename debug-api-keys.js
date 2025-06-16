import { db } from './server/db.js';
import { businesses } from './shared/schema.js';

async function debugApiKeys() {
  try {
    console.log('=== API KEY DEBUG ===\n');
    
    // Check database structure
    const allBusinesses = await db.select().from(businesses);
    console.log('Total businesses:', allBusinesses.length);
    
    const withApiKeys = allBusinesses.filter(b => b.apiKey);
    console.log('Businesses with API keys:', withApiKeys.length);
    
    if (withApiKeys.length > 0) {
      console.log('\nFirst business with API key:');
      console.log('Name:', withApiKeys[0].name);
      console.log('ID:', withApiKeys[0].id);
      console.log('API Key:', withApiKeys[0].apiKey);
      console.log('API Key length:', withApiKeys[0].apiKey?.length);
      console.log('API Key format:', withApiKeys[0].apiKey?.startsWith('bw_') ? 'Correct (bw_ prefix)' : 'Invalid format');
    }
    
    // Check column structure
    console.log('\nDatabase column check:');
    const sampleBusiness = allBusinesses[0];
    if (sampleBusiness) {
      console.log('Available columns:', Object.keys(sampleBusiness));
      console.log('Has apiKey column:', 'apiKey' in sampleBusiness);
      console.log('Has api_key column:', 'api_key' in sampleBusiness);
    }
    
  } catch (error) {
    console.error('Debug failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugApiKeys();