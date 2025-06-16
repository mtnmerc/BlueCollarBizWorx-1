import { db } from './server/db.js';
import { businesses, clients, jobs } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function checkIsolation() {
  try {
    console.log('=== BUSINESS ISOLATION CHECK ===\n');
    
    // Get businesses with API keys
    const businessesWithKeys = await db.select().from(businesses);
    const activeBiz = businessesWithKeys.filter(b => b.apiKey);
    
    console.log('Businesses with API keys:');
    activeBiz.forEach(b => {
      console.log(`- ${b.name} (ID: ${b.id}): ${b.apiKey}`);
    });
    
    if (activeBiz.length < 2) {
      console.log('\nNeed at least 2 businesses with API keys for isolation test');
      return;
    }
    
    // Check data distribution
    for (const biz of activeBiz.slice(0, 2)) {
      console.log(`\n--- ${biz.name} (Business ID: ${biz.id}) ---`);
      
      const bizClients = await db.select().from(clients).where(eq(clients.businessId, biz.id));
      console.log(`Clients: ${bizClients.length}`);
      
      const bizJobs = await db.select().from(jobs).where(eq(jobs.businessId, biz.id));
      console.log(`Jobs: ${bizJobs.length}`);
    }
    
    // Test API key lookup
    console.log('\n=== API KEY VALIDATION TEST ===');
    for (const biz of activeBiz.slice(0, 2)) {
      const foundBusiness = await db.select().from(businesses).where(eq(businesses.apiKey, biz.apiKey));
      console.log(`API Key ${biz.apiKey} -> Business: ${foundBusiness[0]?.name || 'NOT FOUND'}`);
    }
    
  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkIsolation();