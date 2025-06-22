// Simulate exactly what ChatGPT should be doing
async function simulateChatGPTCalls() {
  console.log('=== SIMULATING CHATGPT API CALLS ===\n');
  
  const apiKey = 'bw_ex0i7udnrrumbzikdnd';
  const baseUrl = 'https://bizworx-7faf4.web.app/api/gpt';
  
  // Test exactly what ChatGPT would call for "list my clients"
  console.log('1. Testing GET /clients (what ChatGPT calls for "list my clients"):');
  try {
    const response = await fetch(`${baseUrl}/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'ChatGPT/1.0'
      }
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers), null, 2)}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✓ Response received:');
      console.log(`  Success: ${data.success}`);
      console.log(`  Data type: ${Array.isArray(data.data) ? 'array' : typeof data.data}`);
      console.log(`  Data length: ${data.data?.length || 0}`);
      console.log(`  Message: "${data.message}"`);
      console.log(`  Business: ${data.businessVerification?.businessName}`);
      
      if (data.data && data.data.length > 0) {
        console.log('\n  First client:');
        const client = data.data[0];
        console.log(`    ID: ${client.id}`);
        console.log(`    Name: "${client.name}"`);
        console.log(`    Email: "${client.email}"`);
        console.log(`    Phone: "${client.phone}"`);
      }
      
      console.log('\n  Full JSON structure:');
      console.log(JSON.stringify(data, null, 2));
      
    } else {
      console.log(`✗ Failed with status ${response.status}`);
      const errorText = await response.text();
      console.log(`Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`✗ Request failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('2. Testing if API responds to OPTIONS (CORS preflight):');
  try {
    const optionsResponse = await fetch(`${baseUrl}/clients`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://chat.openai.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'X-API-Key, Content-Type'
      }
    });
    
    console.log(`OPTIONS Status: ${optionsResponse.status}`);
    console.log('CORS Headers:');
    optionsResponse.headers.forEach((value, key) => {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`  ${key}: ${value}`);
      }
    });
    
  } catch (error) {
    console.log(`✗ OPTIONS request failed: ${error.message}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('DIAGNOSIS:');
  console.log('If ChatGPT says "no clients found" but this test shows clients,');
  console.log('the issue is likely:');
  console.log('1. ChatGPT configuration has wrong URL/API key');
  console.log('2. ChatGPT is using old cached schema');
  console.log('3. CORS issues preventing ChatGPT from reading responses');
  console.log('4. ChatGPT parsing issues with response format');
}

simulateChatGPTCalls();