import fetch from 'node-fetch';

const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function verifyServerStatus() {
  console.log('=== VERIFYING SERVER STATUS ===\n');
  
  // Test working ChatGPT endpoints first
  try {
    console.log('Testing working ChatGPT endpoint...');
    const gptResponse = await fetch(`${BASE_URL}/api/gpt/clients`, {
      headers: { 'X-API-Key': 'bw_wkad606ephtmbqx7a0f' }
    });
    
    console.log(`ChatGPT clients endpoint: ${gptResponse.status}`);
    if (gptResponse.ok) {
      const data = await gptResponse.json();
      console.log('✅ ChatGPT endpoints working - server is running');
      console.log(`Clients found: ${data.data?.length || 0}`);
    }
  } catch (error) {
    console.log(`❌ ChatGPT endpoint error: ${error.message}`);
  }
  
  // Test if auth endpoints exist (they should return JSON errors, not HTML)
  console.log('\nTesting authentication endpoint responses...');
  
  try {
    const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Accept': 'application/json' }
    });
    
    const responseText = await authResponse.text();
    console.log(`Auth endpoint status: ${authResponse.status}`);
    
    if (responseText.includes('<!DOCTYPE')) {
      console.log('❌ Auth endpoints returning HTML - routes not registered');
    } else {
      console.log('✅ Auth endpoints returning JSON - routes working');
    }
    
  } catch (error) {
    console.log(`❌ Auth endpoint test error: ${error.message}`);
  }
  
  console.log('\n=== SERVER STATUS CHECK COMPLETE ===');
}

verifyServerStatus();