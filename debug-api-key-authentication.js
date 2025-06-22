// Debug API key authentication to find isolation failure
import { Pool } from '@neondatabase/serverless';

async function debugApiKeyAuthentication() {
  console.log('=== DEBUGGING API KEY AUTHENTICATION ===\n');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  const testKeys = [
    'bw_ex0i7udnrrumbzikdnd',
    'bw_lcf7itxs8qocat5sd5', 
    'bw_y09k0oyq06t9peo4pd'
  ];
  
  // Test each API key against database directly
  for (const apiKey of testKeys) {
    console.log(`\n--- Testing API Key: ${apiKey} ---`);
    
    try {
      // Direct database query
      const result = await pool.query(
        'SELECT id, name, email, api_key FROM businesses WHERE api_key = $1',
        [apiKey]
      );
      
      if (result.rows.length > 0) {
        const business = result.rows[0];
        console.log(`✓ Database lookup:`);
        console.log(`  Business: "${business.name}"`);
        console.log(`  ID: ${business.id}`);
        console.log(`  Email: ${business.email}`);
        
        // Test API endpoint
        const response = await fetch('https://bizworx-7faf4.web.app/api/gpt/clients', {
          headers: { 'X-API-Key': apiKey }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✓ API Response:`);
          console.log(`  Business: "${data.businessVerification?.businessName}"`);
          console.log(`  ID: ${data.businessVerification?.businessId}`);
          console.log(`  Clients: ${data.data?.length || 0}`);
          
          if (business.name !== data.businessVerification?.businessName) {
            console.log(`🚨 MISMATCH! Database says "${business.name}" but API returns "${data.businessVerification?.businessName}"`);
          } else {
            console.log(`✓ Correct business isolation`);
          }
        } else {
          console.log(`✗ API call failed: ${response.status}`);
        }
        
      } else {
        console.log(`✗ No business found for API key in database`);
      }
      
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
  }
  
  await pool.end();
  
  console.log('\n=== SUMMARY ===');
  console.log('This test shows if API keys map to correct businesses in:');
  console.log('1. Database queries (direct)');
  console.log('2. API responses (through authentication middleware)');
  console.log('Any mismatch indicates where the isolation is breaking.');
}

debugApiKeyAuthentication();