import { db } from './server/db.ts';
import { businesses } from './shared/schema.ts';
import { sql } from 'drizzle-orm';

async function testBusinessIsolation() {
  try {
    // Get current API keys
    const allBusinesses = await db.select().from(businesses).where(sql`"apiKey" IS NOT NULL`);
    
    console.log('=== TESTING BUSINESS ISOLATION ===\n');
    
    const testBusinesses = allBusinesses.filter(b => b.apiKey).slice(0, 2);
    
    for (const business of testBusinesses) {
      console.log(`Testing Business: ${business.name} (ID: ${business.id})`);
      console.log(`API Key: ${business.apiKey}`);
      
      // Test clients endpoint
      const clientsResponse = await fetch('http://localhost:5000/api/gpt/clients', {
        headers: { 'X-API-Key': business.apiKey }
      });
      
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        console.log(`  Clients: ${clientsData.data?.length || 0} found`);
        console.log(`  Business Verification: ${clientsData.businessVerification?.businessName}`);
        console.log(`  Business ID: ${clientsData.businessVerification?.businessId}`);
      } else {
        console.log(`  Clients: ERROR ${clientsResponse.status}`);
      }
      
      // Test jobs endpoint
      const jobsResponse = await fetch('http://localhost:5000/api/gpt/jobs', {
        headers: { 'X-API-Key': business.apiKey }
      });
      
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        console.log(`  Jobs: ${jobsData.data?.length || 0} found`);
      } else {
        console.log(`  Jobs: ERROR ${jobsResponse.status}`);
      }
      
      console.log('');
    }
    
    // Cross-contamination test
    if (testBusinesses.length >= 2) {
      console.log('=== CROSS-CONTAMINATION TEST ===');
      const biz1 = testBusinesses[0];
      const biz2 = testBusinesses[1];
      
      console.log(`Testing if ${biz1.name}'s API key can access ${biz2.name}'s data...`);
      
      // This should fail or return empty results
      const crossTestResponse = await fetch('http://localhost:5000/api/gpt/clients', {
        headers: { 'X-API-Key': biz1.apiKey }
      });
      
      if (crossTestResponse.ok) {
        const crossData = await crossTestResponse.json();
        const returnedBusinessId = crossData.businessVerification?.businessId;
        
        if (returnedBusinessId === biz1.id) {
          console.log('✅ ISOLATION WORKING: API key only returns own business data');
        } else if (returnedBusinessId === biz2.id) {
          console.log('❌ ISOLATION BROKEN: API key returning wrong business data');
        } else {
          console.log(`⚠️  UNEXPECTED: Returned business ID ${returnedBusinessId}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testBusinessIsolation();