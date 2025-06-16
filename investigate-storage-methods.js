import { db } from './server/db.ts';
import { businesses } from './shared/schema.ts';
import { storage } from './server/storage-clean.ts';
import { eq } from 'drizzle-orm';

async function investigateStorageMethods() {
  console.log('=== PHASE 2: STORAGE METHOD DEEP DIVE ===\n');
  
  try {
    // Test generateApiKey method with logging
    console.log('1. Testing generateApiKey method...');
    
    // Find a test business
    const testBusiness = await db.select().from(businesses).where().limit(1);
    if (testBusiness.length === 0) {
      console.log('❌ No businesses found for testing');
      return;
    }
    
    const businessId = testBusiness[0].id;
    console.log(`Using business ID ${businessId} (${testBusiness[0].email}) for testing`);
    
    // Store original API key
    const originalApiKey = testBusiness[0].apiKey;
    console.log('Original API key:', originalApiKey);
    
    // Generate new API key
    console.log('\n2. Generating new API key...');
    const newApiKey = await storage.generateApiKey(businessId);
    console.log('Generated API key:', newApiKey);
    
    // Verify it was stored correctly
    const updatedBusiness = await storage.getBusinessById(businessId);
    console.log('Business API key after generation:', updatedBusiness?.apiKey);
    
    if (newApiKey === updatedBusiness?.apiKey) {
      console.log('✅ API key correctly stored in database');
    } else {
      console.log('❌ API key mismatch between generated and stored');
    }
    
    // Test getBusinessByApiKey
    console.log('\n3. Testing getBusinessByApiKey method...');
    const retrievedBusiness = await storage.getBusinessByApiKey(newApiKey);
    
    if (retrievedBusiness && retrievedBusiness.id === businessId) {
      console.log('✅ getBusinessByApiKey returns correct business');
      console.log(`Retrieved business: ID ${retrievedBusiness.id}, Email: ${retrievedBusiness.email}`);
    } else {
      console.log('❌ getBusinessByApiKey returned wrong business or null');
      console.log('Retrieved business:', retrievedBusiness);
    }
    
    // Test with alter3d24@gmail.com business specifically
    console.log('\n4. Testing with alter3d24@gmail.com business...');
    const alter3dBusiness = await storage.getBusinessByEmail('alter3d24@gmail.com');
    
    if (alter3dBusiness) {
      console.log(`Found alter3d business: ID ${alter3dBusiness.id}`);
      
      // Generate API key for alter3d business
      const alter3dApiKey = await storage.generateApiKey(alter3dBusiness.id);
      console.log('Generated API key for alter3d:', alter3dApiKey);
      
      // Verify ownership
      const verifyOwner = await storage.getBusinessByApiKey(alter3dApiKey);
      if (verifyOwner && verifyOwner.id === alter3dBusiness.id) {
        console.log('✅ alter3d API key correctly linked to alter3d business');
      } else {
        console.log('❌ alter3d API key linked to wrong business');
        console.log('Owner:', verifyOwner);
      }
    } else {
      console.log('❌ alter3d24@gmail.com business not found');
    }
    
    // Restore original API key if needed
    if (originalApiKey && businessId !== 1) { // Don't restore alter3d's key
      await db.update(businesses)
        .set({ apiKey: originalApiKey })
        .where(eq(businesses.id, businessId));
      console.log('\n5. Restored original API key for test business');
    }
    
  } catch (error) {
    console.error('Storage method investigation failed:', error);
  }
}

investigateStorageMethods().then(() => {
  console.log('\n=== STORAGE METHOD INVESTIGATION COMPLETE ===');
  process.exit(0);
}).catch(error => {
  console.error('Investigation failed:', error);
  process.exit(1);
});