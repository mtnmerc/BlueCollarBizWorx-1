import { Pool } from '@neondatabase/serverless';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkDatabaseState() {
  console.log('=== DATABASE STATE INVESTIGATION ===\n');
  
  try {
    // Check all businesses and their API keys
    console.log('1. Checking all businesses and API keys:');
    const businesses = await pool.query('SELECT id, name, email, api_key FROM businesses ORDER BY id');
    
    if (businesses.rows.length === 0) {
      console.log('❌ No businesses found in database');
      return;
    }
    
    console.log(`Found ${businesses.rows.length} businesses:`);
    businesses.rows.forEach(business => {
      console.log(`  ID: ${business.id}, Name: ${business.name}, Email: ${business.email}`);
      console.log(`  API Key: ${business.api_key || 'NULL'}`);
      console.log('');
    });
    
    // Check specifically for the known API key
    console.log('2. Searching for known API key: bw_wkad606ephtmbqx7a0f');
    const keySearch = await pool.query('SELECT id, name, api_key FROM businesses WHERE api_key = $1', ['bw_wkad606ephtmbqx7a0f']);
    
    if (keySearch.rows.length > 0) {
      console.log('✅ Found key in database:', keySearch.rows[0]);
    } else {
      console.log('❌ Key not found in database');
    }
    
    // Check for any API keys matching the pattern
    console.log('3. Checking for any API keys with bw_ pattern:');
    const patternSearch = await pool.query("SELECT id, name, api_key FROM businesses WHERE api_key LIKE 'bw_%'");
    
    if (patternSearch.rows.length > 0) {
      console.log(`Found ${patternSearch.rows.length} API keys:`);
      patternSearch.rows.forEach(row => {
        console.log(`  Business: ${row.name}, Key: ${row.api_key}`);
      });
    } else {
      console.log('❌ No API keys found with bw_ pattern');
    }
    
  } catch (error) {
    console.error('Database check failed:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseState();