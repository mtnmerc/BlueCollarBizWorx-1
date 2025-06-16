import { db } from './server/db.js';
import { businesses, clients } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function diagnoseAlter3d24Issue() {
  console.log('=== DIAGNOSING ALTER3D24@GMAIL.COM ISSUE ===\n');
  
  const testApiKey = 'bw_ex0i7udnrrumbzikdnd';
  const testEmail = 'alter3d24@gmail.com';
  
  try {
    // 1. Find business by email
    console.log('1. Finding business by email...');
    const businessByEmail = await db.select().from(businesses).where(eq(businesses.email, testEmail));
    
    if (businessByEmail.length === 0) {
      console.log('❌ NO BUSINESS FOUND with email:', testEmail);
      return;
    }
    
    const business = businessByEmail[0];
    console.log('✓ Business found:');
    console.log('  - ID:', business.id);
    console.log('  - Name:', business.name);
    console.log('  - Email:', business.email);
    console.log('  - API Key:', business.apiKey);
    
    // 2. Check API key match
    console.log('\n2. Checking API key match...');
    if (business.apiKey === testApiKey) {
      console.log('✓ API key matches the business');
    } else {
      console.log('❌ API KEY MISMATCH:');
      console.log('  - Expected:', testApiKey);
      console.log('  - Actual:', business.apiKey);
    }
    
    // 3. Find business by API key (how the authentication works)
    console.log('\n3. Testing API key authentication lookup...');
    const businessByApiKey = await db.select().from(businesses).where(eq(businesses.apiKey, testApiKey));
    
    if (businessByApiKey.length === 0) {
      console.log('❌ NO BUSINESS FOUND with API key:', testApiKey);
    } else {
      console.log('✓ Business found by API key:');
      console.log('  - ID:', businessByApiKey[0].id);
      console.log('  - Name:', businessByApiKey[0].name);
    }
    
    // 4. Check clients for this business
    console.log('\n4. Checking clients for business ID:', business.id);
    const businessClients = await db.select().from(clients).where(eq(clients.businessId, business.id));
    
    console.log('Clients found:', businessClients.length);
    if (businessClients.length > 0) {
      console.log('Client details:');
      businessClients.forEach((client, index) => {
        console.log(`  ${index + 1}. ${client.name} (ID: ${client.id}) - ${client.email}`);
      });
    }
    
    // 5. Check if there are clients with wrong businessId
    console.log('\n5. Checking for clients that might be assigned to wrong business...');
    const allClients = await db.select().from(clients);
    const clientsWithDifferentEmail = allClients.filter(client => 
      client.email?.includes('alter3d24') || 
      client.name?.toLowerCase().includes('alter')
    );
    
    if (clientsWithDifferentEmail.length > 0) {
      console.log('Found clients that might belong to alter3d24:');
      clientsWithDifferentEmail.forEach(client => {
        console.log(`  - ${client.name} (Business ID: ${client.businessId}) - ${client.email}`);
      });
    }
    
    // 6. Summary
    console.log('\n=== DIAGNOSIS SUMMARY ===');
    console.log('Business exists:', businessByEmail.length > 0 ? 'YES' : 'NO');
    console.log('API key matches:', business.apiKey === testApiKey ? 'YES' : 'NO');
    console.log('API key lookup works:', businessByApiKey.length > 0 ? 'YES' : 'NO');
    console.log('Clients count:', businessClients.length);
    
  } catch (error) {
    console.error('Diagnosis failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

diagnoseAlter3d24Issue();