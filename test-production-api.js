// Test the actual production API call that ChatGPT would make
const API_KEY = 'bw_wkad606ephtmbqx7a0f';

async function testProductionAPI() {
  console.log('=== TESTING PRODUCTION API CALL ===\n');
  
  try {
    const response = await fetch('https://bizworx-7faf4.web.app/api/gpt/clients', {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('\nFull Response:');
    console.log(responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('\n=== PARSED DATA ===');
      console.log('Success:', data.success);
      console.log('Message:', data.message);
      console.log('Business Name:', data.businessVerification?.businessName);
      console.log('Business ID:', data.businessVerification?.businessId);
      console.log('Clients Count:', data.data?.length || 0);
      
      if (data.data && data.data.length > 0) {
        console.log('\nClient List:');
        data.data.forEach((client, index) => {
          console.log(`  ${index + 1}. ${client.name} - ${client.email}`);
        });
      }
    }
    
  } catch (error) {
    console.error('API call failed:', error.message);
  }
}

testProductionAPI();