import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function debugChatGPTRequests() {
  console.log('Testing all possible ChatGPT request patterns...\n');
  
  // These are the patterns ChatGPT might be using based on operationId
  const testCases = [
    { method: 'GET', url: '/api/gpt/jobs', name: 'getJobs' },
    { method: 'GET', url: '/api/gpt/dashboard', name: 'getDashboard' },
    { method: 'GET', url: '/api/gpt/clients', name: 'getClients' },
    { method: 'POST', url: '/api/gpt/jobs', name: 'getJobs POST' },
    { method: 'POST', url: '/api/gpt/dashboard', name: 'getDashboard POST' },
    { method: 'POST', url: '/api/gpt/clients', name: 'getClients POST' },
    // Alternative paths ChatGPT might try
    { method: 'GET', url: '/getJobs', name: 'direct getJobs' },
    { method: 'GET', url: '/getDashboard', name: 'direct getDashboard' },
    { method: 'POST', url: '/getJobs', name: 'direct getJobs POST' },
    { method: 'POST', url: '/getDashboard', name: 'direct getDashboard POST' }
  ];
  
  for (const test of testCases) {
    try {
      const options = {
        method: test.method,
        headers: {
          'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'ChatGPT/OpenAI'
        }
      };
      
      if (test.method === 'POST') {
        options.body = JSON.stringify({});
      }
      
      const response = await fetch(`${BASE_URL}${test.url}`, options);
      const text = await response.text();
      
      console.log(`${test.name}: ${response.status}`);
      
      if (response.status === 400) {
        console.log(`  ❌ BAD REQUEST - This is what ChatGPT is hitting`);
        if (text.includes('<html>')) {
          console.log(`  ❌ HTML error page`);
        } else {
          try {
            const data = JSON.parse(text);
            console.log(`  Error: ${data.error || data.message}`);
          } catch (e) {
            console.log(`  Raw error: ${text.substring(0, 100)}`);
          }
        }
      } else if (response.status === 200) {
        console.log(`  ✅ SUCCESS`);
        try {
          const data = JSON.parse(text);
          if (data.data) {
            console.log(`  Data items: ${Array.isArray(data.data) ? data.data.length : 'object'}`);
          }
        } catch (e) {
          console.log(`  Response: ${text.substring(0, 50)}...`);
        }
      } else if (response.status === 404) {
        console.log(`  ❌ NOT FOUND`);
      } else if (response.status === 405) {
        console.log(`  ❌ METHOD NOT ALLOWED`);
      }
      
    } catch (error) {
      console.log(`${test.name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('\n=== DEBUGGING RECOMMENDATION ===');
  console.log('Based on the results above, the issue is likely:');
  console.log('1. ChatGPT is calling the wrong HTTP method (POST instead of GET)');
  console.log('2. ChatGPT is calling the wrong endpoint path');
  console.log('3. Missing required headers or request body format');
  console.log('\nNext step: Add the missing endpoints or fix the OpenAPI schema operationId mapping');
}

debugChatGPTRequests();