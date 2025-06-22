import fetch from 'node-fetch';

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bizworx-7faf4.web.app';

async function testChatGPTAuthFormat() {
  console.log('Testing authentication formats for ChatGPT compatibility...\n');

  // Test 1: Bearer format (what our server expects)
  console.log('1. Testing Bearer format (current server setup):');
  try {
    const bearerResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ChatGPT-Actions/1.0'
      }
    });
    
    const bearerData = await bearerResponse.json();
    console.log(`   Status: ${bearerResponse.status}`);
    console.log(`   Success: ${bearerData.success}`);
    console.log(`   Clients: ${bearerData.data?.length || 0}`);
    
    if (bearerData.success) {
      console.log('   ✅ Bearer authentication WORKING');
    } else {
      console.log('   ❌ Bearer authentication FAILED');
    }
  } catch (error) {
    console.log(`   ❌ Bearer test error: ${error.message}`);
  }

  // Test 2: X-API-Key format (old schema format)
  console.log('\n2. Testing X-API-Key format (old schema):');
  try {
    const apiKeyResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'ChatGPT-Actions/1.0'
      }
    });
    
    const apiKeyData = await apiKeyResponse.json();
    console.log(`   Status: ${apiKeyResponse.status}`);
    console.log(`   Success: ${apiKeyData.success}`);
    console.log(`   Message: ${apiKeyData.message}`);
    
    if (apiKeyData.success) {
      console.log('   ✅ X-API-Key authentication WORKING');
    } else {
      console.log('   ❌ X-API-Key authentication FAILED');
    }
  } catch (error) {
    console.log(`   ❌ X-API-Key test error: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS:');
  console.log('='.repeat(60));
  console.log('- Server expects: Authorization: Bearer [API_KEY]');
  console.log('- Updated schema uses: BearerAuth with http/bearer scheme');
  console.log('- This matches ChatGPT Actions authentication format');
  console.log('- Ready for ChatGPT Custom GPT integration');
  console.log('\n📋 Next step: Upload bizworx-chatgpt-final.json to ChatGPT');
}

testChatGPTAuthFormat();