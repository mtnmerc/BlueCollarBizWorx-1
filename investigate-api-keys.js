import { db } from './server/db.ts';
import { businesses } from './shared/schema.ts';

async function investigateApiKeys() {
  console.log('=== PHASE 1: DATABASE SCHEMA & STATE ANALYSIS ===\n');
  
  try {
    // 1. Query all businesses and their API keys
    console.log('1. Querying all businesses and their API keys...');
    const allBusinesses = await db.select({
      id: businesses.id,
      name: businesses.name,
      email: businesses.email,
      apiKey: businesses.apiKey
    }).from(businesses);
    
    console.log('Total businesses found:', allBusinesses.length);
    console.log('\nBusiness data:');
    allBusinesses.forEach(business => {
      console.log(`ID: ${business.id}, Name: ${business.name}, Email: ${business.email}, API Key: ${business.apiKey || 'NULL'}`);
    });
    
    // 2. Check for duplicate API keys
    console.log('\n2. Checking for duplicate API keys...');
    const apiKeys = allBusinesses.filter(b => b.apiKey).map(b => b.apiKey);
    const uniqueApiKeys = [...new Set(apiKeys)];
    
    if (apiKeys.length !== uniqueApiKeys.length) {
      console.log('❌ DUPLICATE API KEYS FOUND!');
      console.log('Total API keys:', apiKeys.length);
      console.log('Unique API keys:', uniqueApiKeys.length);
      
      // Find duplicates
      const duplicates = apiKeys.filter((key, index) => apiKeys.indexOf(key) !== index);
      console.log('Duplicate keys:', duplicates);
    } else {
      console.log('✅ No duplicate API keys found');
    }
    
    // 3. Check specific businesses mentioned by user
    console.log('\n3. Checking specific businesses...');
    const alter3dBusiness = allBusinesses.find(b => b.email === 'alter3d24@gmail.com');
    const flatlineBusiness = allBusinesses.find(b => b.email === 'admin@flatlineearthworks.com');
    
    if (alter3dBusiness) {
      console.log('alter3d24@gmail.com business:', {
        id: alter3dBusiness.id,
        name: alter3dBusiness.name,
        apiKey: alter3dBusiness.apiKey
      });
    } else {
      console.log('❌ alter3d24@gmail.com business not found');
    }
    
    if (flatlineBusiness) {
      console.log('admin@flatlineearthworks.com business:', {
        id: flatlineBusiness.id,
        name: flatlineBusiness.name,
        apiKey: flatlineBusiness.apiKey
      });
    } else {
      console.log('❌ admin@flatlineearthworks.com business not found');
    }
    
    // 4. Check if these businesses share API keys
    if (alter3dBusiness && flatlineBusiness) {
      if (alter3dBusiness.apiKey && flatlineBusiness.apiKey && 
          alter3dBusiness.apiKey === flatlineBusiness.apiKey) {
        console.log('❌ CRITICAL ISSUE: Both businesses share the same API key!');
        console.log('Shared API key:', alter3dBusiness.apiKey);
      } else {
        console.log('✅ Businesses have different API keys (or one/both are null)');
      }
    }
    
  } catch (error) {
    console.error('Database investigation failed:', error);
  }
}

investigateApiKeys().then(() => {
  console.log('\n=== DATABASE INVESTIGATION COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Investigation failed:', error);
  process.exit(1);
});