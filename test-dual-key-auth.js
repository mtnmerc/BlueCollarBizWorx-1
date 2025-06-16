import { Pool } from '@neondatabase/serverless';
import ws from 'ws';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function testDualKeyAuth() {
  console.log('=== TESTING DUAL-KEY AUTHENTICATION ===\n');
  
  try {
    // 1. Add api_secret column if it doesn't exist
    console.log('1. Adding api_secret column...');
    await pool.query(`
      ALTER TABLE businesses 
      ADD COLUMN IF NOT EXISTS api_secret TEXT UNIQUE
    `);
    
    // 2. Generate secrets for existing businesses
    console.log('2. Generating secrets for existing businesses...');
    const businesses = await pool.query(`
      SELECT id, name, api_key, api_secret 
      FROM businesses 
      WHERE api_key IS NOT NULL
    `);
    
    console.log(`Found ${businesses.rows.length} businesses with API keys`);
    
    for (const business of businesses.rows) {
      if (!business.api_secret) {
        // Generate readable passphrase secret
        const words = [
          'swift', 'bright', 'secure', 'rapid', 'clever', 'strong', 'silent', 'golden',
          'crystal', 'diamond', 'steel', 'iron', 'copper', 'silver', 'bronze', 'marble',
          'ocean', 'river', 'mountain', 'forest', 'desert', 'valley', 'island', 'meadow',
          'thunder', 'lightning', 'storm', 'breeze', 'sunshine', 'rainbow', 'comet', 'star',
          'falcon', 'eagle', 'tiger', 'lion', 'wolf', 'bear', 'shark', 'dolphin'
        ];
        
        const word1 = words[Math.floor(Math.random() * words.length)];
        const word2 = words[Math.floor(Math.random() * words.length)];
        const word3 = words[Math.floor(Math.random() * words.length)];
        const numbers = Math.floor(1000 + Math.random() * 9000);
        
        const secret = `${word1}-${word2}-${word3}-${numbers}`;
        
        await pool.query(`
          UPDATE businesses 
          SET api_secret = $1 
          WHERE id = $2
        `, [secret, business.id]);
        console.log(`Generated secret for business: ${business.name} -> ${secret}`);
      } else {
        console.log(`Business ${business.name} already has secret: ${business.api_secret}`);
      }
    }
    
    // 3. Test the authentication
    console.log('\n3. Testing dual-key authentication...');
    const testBusiness = businesses.rows[0];
    if (testBusiness) {
      const updatedBusiness = await pool.query(`
        SELECT id, name, api_key, api_secret 
        FROM businesses 
        WHERE id = $1
      `, [testBusiness.id]);
      
      const biz = updatedBusiness.rows[0];
      console.log(`\nTest Business: ${biz.name}`);
      console.log(`API Key: ${biz.api_key}`);
      console.log(`API Secret: ${biz.api_secret}`);
      
      // Test the dual authentication
      const authTest = await pool.query(`
        SELECT id, name 
        FROM businesses 
        WHERE api_key = $1 AND api_secret = $2
      `, [biz.api_key, biz.api_secret]);
      
      if (authTest.rows.length > 0) {
        console.log('✅ Dual-key authentication works!');
        
        // Test GPT endpoint with new credentials
        console.log('\n4. Testing GPT endpoint with dual keys...');
        const response = await fetch('https://bluecollarbizworx.replit.app/api/gpt/clients', {
          headers: {
            'X-API-Key': biz.api_key,
            'X-API-Secret': biz.api_secret,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          console.log('✅ GPT endpoint authentication successful!');
          const data = await response.json();
          console.log(`Response: ${JSON.stringify(data).substring(0, 200)}...`);
        } else {
          console.log(`❌ GPT endpoint failed: ${response.status} ${response.statusText}`);
          const error = await response.text();
          console.log(`Error: ${error}`);
        }
        
      } else {
        console.log('❌ Dual-key authentication failed');
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await pool.end();
  }
}

testDualKeyAuth();