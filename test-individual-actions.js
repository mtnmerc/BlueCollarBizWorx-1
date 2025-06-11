import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testIndividualActions() {
  console.log('Testing individual ChatGPT actions...\n');
  
  const actions = [
    {
      name: 'Clients Action',
      endpoint: '/api/gpt/clients',
      operation: 'getClients()',
      file: 'chatgpt-action-clients.json'
    },
    {
      name: 'Jobs Action', 
      endpoint: '/api/gpt/jobs',
      operation: 'getJobs()',
      file: 'chatgpt-action-jobs.json'
    },
    {
      name: 'Dashboard Action',
      endpoint: '/api/gpt/dashboard', 
      operation: 'getDashboard()',
      file: 'chatgpt-action-dashboard.json'
    }
  ];
  
  for (const action of actions) {
    console.log(`=== ${action.name} ===`);
    console.log(`File: ${action.file}`);
    console.log(`Operation: ${action.operation}`);
    console.log(`Endpoint: ${action.endpoint}`);
    
    try {
      const response = await fetch(`${BASE_URL}${action.endpoint}`, {
        method: 'GET',
        headers: {
          'X-API-Key': 'bw_wkad606ephtmbqx7a0f',
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      const text = await response.text();
      
      if (response.status === 200) {
        try {
          const data = JSON.parse(text);
          console.log(`Status: SUCCESS (${response.status})`);
          console.log(`Business: ${data.businessVerification?.businessName || 'Flatline Earthworks'}`);
          
          if (Array.isArray(data.data)) {
            console.log(`Data count: ${data.data.length} items`);
            if (data.data.length > 0) {
              const sample = data.data[0];
              console.log(`Sample: ${sample.name || sample.title || 'N/A'}`);
            }
          } else if (data.data && typeof data.data === 'object') {
            console.log(`Metrics: ${JSON.stringify(data.data)}`);
          }
          
          console.log(`Message: ${data.message}`);
          console.log('✅ Action ready for ChatGPT');
        } catch (e) {
          console.log(`❌ JSON parsing failed`);
        }
      } else {
        console.log(`❌ Failed: ${response.status}`);
        console.log(`Response: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`❌ Network error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('=== SETUP INSTRUCTIONS ===');
  console.log('1. In ChatGPT Custom GPT, create 3 separate actions:');
  console.log('   Action 1: Upload chatgpt-action-clients.json');
  console.log('   Action 2: Upload chatgpt-action-jobs.json'); 
  console.log('   Action 3: Upload chatgpt-action-dashboard.json');
  console.log('');
  console.log('2. For each action, set authentication:');
  console.log('   Type: API Key');
  console.log('   Header Name: X-API-Key');
  console.log('   API Key: bw_wkad606ephtmbqx7a0f');
  console.log('');
  console.log('3. Test each action individually in ChatGPT');
  console.log('   "Get my clients"');
  console.log('   "Show me my jobs"'); 
  console.log('   "Display dashboard metrics"');
}

testIndividualActions();