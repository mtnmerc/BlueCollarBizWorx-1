#!/usr/bin/env node

const API_KEY = 'bw_wkad606ephtmbqx7a0f';
const BASE_URL = 'https://bizworx-7faf4.web.app';

async function testEstimatesEndpoint() {
  console.log('Testing updated estimates endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/gpt/estimates`, {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    
    const data = await response.json();
    console.log('\n=== ESTIMATES RESPONSE STRUCTURE ===');
    console.log('Response keys:', Object.keys(data));
    
    if (data.data && data.data.length > 0) {
      console.log('\n=== FIRST ESTIMATE STRUCTURE ===');
      const firstEstimate = data.data[0];
      console.log('Estimate keys:', Object.keys(firstEstimate));
      console.log('Sample estimate:', JSON.stringify(firstEstimate, null, 2));
      
      // Check for schema compliance
      const requiredFields = ['id', 'businessId', 'clientId', 'title', 'description', 'items', 'subtotal', 'tax', 'total', 'status', 'clientName'];
      const missingFields = requiredFields.filter(field => !(field in firstEstimate));
      
      if (missingFields.length === 0) {
        console.log('✅ All required schema fields present');
      } else {
        console.log('❌ Missing schema fields:', missingFields);
      }
      
      // Check items array structure
      if (Array.isArray(firstEstimate.items)) {
        console.log('✅ Items is an array');
        if (firstEstimate.items.length > 0) {
          console.log('Item structure:', Object.keys(firstEstimate.items[0]));
        } else {
          console.log('⚠️  Items array is empty');
        }
      } else {
        console.log('❌ Items is not an array');
      }
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testEstimatesEndpoint();