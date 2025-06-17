import fetch from 'node-fetch';

async function testDeploymentUrls() {
  const urls = [
    'https://bizworx--42121209.replit.app/api/health',
    'https://bizworx--42121209.replit.app:3001/health',
    'https://fbf1b1b7-98a9-49ca-b298-a38e5e49b52d-00-3mipjdqpwprkg.kirk.replit.dev/api/health',
    'https://fbf1b1b7-98a9-49ca-b298-a38e5e49b52d-00-3mipjdqpwprkg.kirk.replit.dev:3001/health'
  ];

  console.log('Testing deployment URLs...\n');

  for (const url of urls) {
    try {
      console.log(`Testing: ${url}`);
      const response = await fetch(url, { timeout: 5000 });
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Response: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
    console.log('---');
  }
}

testDeploymentUrls();