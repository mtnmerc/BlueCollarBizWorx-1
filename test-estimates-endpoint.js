#!/usr/bin/env node

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bluecollarbizworx.replit.app';

async function testEstimatesEndpoint() {
  console.log('Testing estimates endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/estimates`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON - response is not valid JSON');
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

// Also test clients endpoint for comparison
async function testClientsEndpoint() {
  console.log('\nTesting clients endpoint for comparison...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/clients`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testEstimatesEndpoint().then(() => testClientsEndpoint());