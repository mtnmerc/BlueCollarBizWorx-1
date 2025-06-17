// Test with ChatGPT-like headers to see if there's a difference

async function testChatGPTHeaders() {
  const testUrl = 'https://bluecollarbizworx.replit.app/api/gpt/clients';
  const testKey = 'bw_lcf7itxs8qocat5sd5';

  // Test with various header combinations that ChatGPT might send
  const testCases = [
    {
      name: 'Standard headers',
      headers: {
        'X-API-Key': testKey,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'ChatGPT User-Agent',
      headers: {
        'X-API-Key': testKey,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)'
      }
    },
    {
      name: 'Lowercase header',
      headers: {
        'x-api-key': testKey,
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Authorization Bearer',
      headers: {
        'Authorization': `Bearer ${testKey}`,
        'Content-Type': 'application/json'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n=== ${testCase.name} ===`);
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        headers: testCase.headers
      });

      console.log('Status:', response.status);
      const responseText = await response.text();
      
      if (response.ok) {
        const data = JSON.parse(responseText);
        console.log('✓ Success - Business:', data.businessVerification?.businessName);
      } else {
        console.log('✗ Failed:', responseText);
      }
    } catch (error) {
      console.error('Request error:', error.message);
    }
  }
}

testChatGPTHeaders();