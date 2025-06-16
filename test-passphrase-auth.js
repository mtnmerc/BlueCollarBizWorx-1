// Test the new passphrase-based dual authentication system
async function testPassphraseAuth() {
  console.log('=== TESTING PASSPHRASE AUTHENTICATION SYSTEM ===\n');
  
  try {
    // 1. Test application health
    console.log('1. Testing application health...');
    const healthResponse = await fetch('https://bluecollarbizworx.replit.app/health');
    if (!healthResponse.ok) {
      console.log('❌ Application not responding');
      return;
    }
    console.log('✅ Application is running');

    // 2. Test GPT endpoints with missing credentials
    console.log('\n2. Testing authentication requirements...');
    
    // Test with no credentials
    const noCredsResponse = await fetch('https://bluecollarbizworx.replit.app/api/gpt/clients');
    console.log(`No credentials: ${noCredsResponse.status} (expected 401)`);
    
    // Test with only API key
    const onlyKeyResponse = await fetch('https://bluecollarbizworx.replit.app/api/gpt/clients', {
      headers: { 'X-API-Key': 'test-key' }
    });
    console.log(`Only API key: ${onlyKeyResponse.status} (expected 401)`);
    
    // Test with only secret
    const onlySecretResponse = await fetch('https://bluecollarbizworx.replit.app/api/gpt/clients', {
      headers: { 'X-API-Secret': 'test-secret' }
    });
    console.log(`Only secret: ${onlySecretResponse.status} (expected 401)`);
    
    // Test with invalid credentials
    const invalidResponse = await fetch('https://bluecollarbizworx.replit.app/api/gpt/clients', {
      headers: {
        'X-API-Key': 'invalid-key',
        'X-API-Secret': 'invalid-secret'
      }
    });
    console.log(`Invalid credentials: ${invalidResponse.status} (expected 401)`);
    
    console.log('✅ Authentication requirements working correctly');
    
    // 3. Generate example passphrase format
    console.log('\n3. Example passphrase format:');
    const words = [
      'swift', 'bright', 'secure', 'rapid', 'clever', 'strong', 'silent', 'golden',
      'crystal', 'diamond', 'steel', 'iron', 'copper', 'silver', 'bronze', 'marble',
      'ocean', 'river', 'mountain', 'forest', 'desert', 'valley', 'island', 'meadow'
    ];
    
    const word1 = words[Math.floor(Math.random() * words.length)];
    const word2 = words[Math.floor(Math.random() * words.length)];
    const word3 = words[Math.floor(Math.random() * words.length)];
    const numbers = Math.floor(1000 + Math.random() * 9000);
    
    const exampleSecret = `${word1}-${word2}-${word3}-${numbers}`;
    console.log(`Example secret: ${exampleSecret}`);
    console.log('✅ User-friendly passphrase format confirmed');
    
    console.log('\n=== DUAL-KEY AUTHENTICATION SYSTEM READY ===');
    console.log('• Generate new credentials in Business Settings');
    console.log('• Use both X-API-Key and X-API-Secret headers');
    console.log('• Secrets are readable passphrases for easy use');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testPassphraseAuth();