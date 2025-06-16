// Find the correct API key for alter3d24@gmail.com
async function findCorrectApiKey() {
  console.log('=== FINDING CORRECT API KEY FOR alter3d24@gmail.com ===\n');
  
  const userEmail = 'alter3d24@gmail.com';
  
  // Direct database query to find business by email
  try {
    const { Pool } = require('@neondatabase/serverless');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('Searching for business with email:', userEmail);
    
    const result = await pool.query(
      'SELECT id, name, email, api_key FROM businesses WHERE email = $1',
      [userEmail]
    );
    
    if (result.rows.length > 0) {
      const business = result.rows[0];
      console.log('✓ Found business for alter3d24@gmail.com:');
      console.log(`  Business ID: ${business.id}`);
      console.log(`  Business Name: "${business.name}"`);
      console.log(`  Email: ${business.email}`);
      console.log(`  API Key: ${business.api_key || 'No API key set'}`);
      
      if (business.api_key) {
        console.log('\n--- Testing correct API key ---');
        const testResponse = await fetch('https://bluecollarbizworx.replit.app/api/gpt/clients', {
          headers: { 'X-API-Key': business.api_key }
        });
        
        if (testResponse.ok) {
          const data = await testResponse.json();
          console.log(`✓ Correct API key works! Found ${data.data?.length || 0} clients`);
          console.log(`  Business: ${data.businessVerification?.businessName}`);
        } else {
          console.log('✗ API key failed authentication');
        }
      } else {
        console.log('\n--- Generating API key for this business ---');
        const generateResponse = await fetch('https://bluecollarbizworx.replit.app/api/generate-api-key', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId: business.id })
        });
        
        if (generateResponse.ok) {
          const apiData = await generateResponse.json();
          console.log('✓ Generated new API key:', apiData.apiKey);
        } else {
          console.log('✗ Failed to generate API key');
        }
      }
    } else {
      console.log('✗ No business found for alter3d24@gmail.com');
      
      // Check if there are other businesses with similar emails
      console.log('\n--- Checking for similar email addresses ---');
      const similarResult = await pool.query(
        'SELECT id, name, email FROM businesses WHERE email LIKE $1',
        ['%alter3d24%']
      );
      
      if (similarResult.rows.length > 0) {
        console.log('Found similar email addresses:');
        similarResult.rows.forEach(business => {
          console.log(`  ${business.id}: ${business.name} (${business.email})`);
        });
      } else {
        console.log('No similar email addresses found');
      }
    }
    
    // Also check what business the current API key belongs to
    console.log('\n--- Current API key business mapping ---');
    const currentKeyResult = await pool.query(
      'SELECT id, name, email FROM businesses WHERE api_key = $1',
      ['bw_ex0i7udnrrumbzikdnd']
    );
    
    if (currentKeyResult.rows.length > 0) {
      const keyBusiness = currentKeyResult.rows[0];
      console.log('Current API key bw_ex0i7udnrrumbzikdnd belongs to:');
      console.log(`  Business: ${keyBusiness.name}`);
      console.log(`  Email: ${keyBusiness.email}`);
      console.log(`  ID: ${keyBusiness.id}`);
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('Database query error:', error.message);
  }
}

findCorrectApiKey();