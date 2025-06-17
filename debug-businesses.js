import { db } from './server/db.ts';
import { businesses, users } from './shared/schema.ts';

async function debugBusinessIsolation() {
  try {
    console.log('=== BUSINESS ISOLATION DIAGNOSIS ===\n');
    
    // Get all businesses
    const allBusinesses = await db.select().from(businesses);
    console.log('All Businesses:');
    allBusinesses.forEach(b => {
      console.log(`  ID: ${b.id}, Email: ${b.email}, Name: ${b.name}, API Key: ${b.apiKey || 'NONE'}`);
    });
    console.log('');
    
    // Get all users
    const allUsers = await db.select().from(users);
    console.log('All Users:');
    allUsers.forEach(u => {
      console.log(`  ID: ${u.id}, Business: ${u.businessId}, Email: ${u.email}, Role: ${u.role}`);
    });
    console.log('');
    
    // Find the mdgross8921@gmail.com account
    const targetUser = allUsers.find(u => u.email === 'mdgross8921@gmail.com');
    if (targetUser) {
      console.log(`Target User Found: Business ID ${targetUser.businessId}`);
      const targetBusiness = allBusinesses.find(b => b.id === targetUser.businessId);
      if (targetBusiness) {
        console.log(`Target Business: ${targetBusiness.name} (${targetBusiness.email})`);
        console.log(`API Key: ${targetBusiness.apiKey || 'NONE'}`);
      }
    } else {
      console.log('❌ User mdgross8921@gmail.com not found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

debugBusinessIsolation();