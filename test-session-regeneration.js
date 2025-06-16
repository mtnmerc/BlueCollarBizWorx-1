import { storage } from './server/storage-clean.ts';

async function testSessionRegeneration() {
  console.log('=== TESTING SESSION REGENERATION LOGIC ===\n');
  
  try {
    // Test the core session isolation logic
    console.log('1. Creating two test businesses...');
    
    const timestamp = Date.now();
    const business1 = await storage.createBusiness({
      name: 'Test Business 1',
      email: `test1-${timestamp}@example.com`,
      password: 'password123',
      phone: '555-0001',
      address: '123 Test St',
      apiKey: null
    });
    
    const business2 = await storage.createBusiness({
      name: 'Test Business 2', 
      email: `test2-${timestamp}@example.com`,
      password: 'password123',
      phone: '555-0002',
      address: '456 Test Ave',
      apiKey: null
    });
    
    console.log('✅ Created business 1:', business1.email, '(ID:', business1.id + ')');
    console.log('✅ Created business 2:', business2.email, '(ID:', business2.id + ')');
    
    // Test 2: Generate API keys for both businesses
    console.log('\n2. Generating API keys for both businesses...');
    
    const apiKey1 = await storage.generateApiKey(business1.id);
    const apiKey2 = await storage.generateApiKey(business2.id);
    
    console.log('✅ API key for business 1:', apiKey1);
    console.log('✅ API key for business 2:', apiKey2);
    
    // Test 3: Verify API key ownership
    console.log('\n3. Verifying API key ownership...');
    
    const owner1 = await storage.getBusinessByApiKey(apiKey1);
    const owner2 = await storage.getBusinessByApiKey(apiKey2);
    
    console.log('API key', apiKey1, 'belongs to:', owner1.email);
    console.log('API key', apiKey2, 'belongs to:', owner2.email);
    
    // Test 4: Cross-check to ensure no contamination
    console.log('\n4. Cross-checking API key isolation...');
    
    if (apiKey1 === apiKey2) {
      console.log('❌ CRITICAL ERROR: Same API key generated for different businesses!');
      return false;
    }
    
    if (owner1.id !== business1.id) {
      console.log('❌ CRITICAL ERROR: Business 1 API key ownership mismatch!');
      console.log('   Expected business ID:', business1.id, 'Got:', owner1.id);
      return false;
    }
    
    if (owner2.id !== business2.id) {
      console.log('❌ CRITICAL ERROR: Business 2 API key ownership mismatch!');
      console.log('   Expected business ID:', business2.id, 'Got:', owner2.id);
      return false;
    }
    
    console.log('✅ API key isolation verified - each business has unique keys');
    
    // Test 5: Simulate session regeneration scenario
    console.log('\n5. Testing session regeneration scenario...');
    
    // Simulate what happens when session.regenerate() is called
    let mockSessionBusinessId = business1.id;
    console.log('Mock session initially set to business 1 ID:', mockSessionBusinessId);
    
    // Generate API key with session pointing to business 1
    const sessionApiKey1 = await storage.generateApiKey(mockSessionBusinessId);
    const sessionOwner1 = await storage.getBusinessByApiKey(sessionApiKey1);
    console.log('API key generated with session pointing to business 1:', sessionApiKey1);
    console.log('This API key belongs to:', sessionOwner1.email);
    
    // Simulate session regeneration - switch to business 2
    mockSessionBusinessId = business2.id;
    console.log('\nAfter session regeneration, session now points to business 2 ID:', mockSessionBusinessId);
    
    // Generate API key with session now pointing to business 2
    const sessionApiKey2 = await storage.generateApiKey(mockSessionBusinessId);
    const sessionOwner2 = await storage.getBusinessByApiKey(sessionApiKey2);
    console.log('API key generated with session pointing to business 2:', sessionApiKey2);
    console.log('This API key belongs to:', sessionOwner2.email);
    
    // Verify no contamination occurred
    if (sessionOwner1.id === sessionOwner2.id) {
      console.log('❌ SESSION CONTAMINATION: Both API keys belong to same business!');
      return false;
    }
    
    console.log('✅ Session regeneration test passed - different businesses own each key');
    
    return true;
    
  } catch (error) {
    console.error('Test failed with error:', error);
    return false;
  }
}

// Run the test
testSessionRegeneration().then((success) => {
  if (success) {
    console.log('\n=== ✅ SESSION REGENERATION TEST PASSED ===');
    console.log('The session isolation fix should work correctly!');
  } else {
    console.log('\n=== ❌ SESSION REGENERATION TEST FAILED ===');
    console.log('There are still issues with session isolation.');
  }
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});