// Test with exact ChatGPT header format
async function testExactChatGPT() {
  const response = await fetch('https://bluecollarbizworx.replit.app/api/gpt/clients', {
    method: 'GET',
    headers: {
      'X-API-Key': 'bw_lcf7itxs8qocat5sd5',
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)'
    }
  });

  console.log('Status:', response.status);
  const responseText = await response.text();
  console.log('Response:', responseText.substring(0, 200) + '...');
  
  if (response.ok) {
    const data = JSON.parse(responseText);
    console.log('✓ Authentication successful');
    console.log('Business:', data.businessVerification?.businessName);
    console.log('Clients found:', data.data?.length || 0);
  } else {
    console.log('✗ Authentication failed');
  }
}

testExactChatGPT();