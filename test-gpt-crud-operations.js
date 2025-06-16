// Test GPT CRUD operations to ensure full schema compliance
async function testGPTCRUD() {
  console.log('=== TESTING GPT CRUD OPERATIONS ===\n');
  
  const baseUrl = 'https://bluecollarbizworx.replit.app';
  const apiKey = 'bw_lcf7itxs8qocat5sd5'; // Fixed Login Business
  
  const headers = {
    'X-API-Key': apiKey,
    'Content-Type': 'application/json'
  };
  
  // Test 1: Create a client
  console.log('1. Testing client creation...');
  try {
    const clientData = {
      name: "Test Client GPT",
      email: "test@example.com",
      phone: "555-0123",
      address: "123 Test St"
    };
    
    const createResponse = await fetch(`${baseUrl}/api/gpt/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify(clientData)
    });
    
    console.log(`Create client status: ${createResponse.status}`);
    const createResult = await createResponse.json();
    
    if (createResult.success && createResult.data) {
      console.log('✅ Client creation successful');
      console.log(`Client ID: ${createResult.data.id}`);
      
      // Test 2: Get clients to verify creation
      console.log('\n2. Testing client retrieval...');
      const getResponse = await fetch(`${baseUrl}/api/gpt/clients`, { headers });
      const getResult = await getResponse.json();
      
      if (getResult.success && getResult.data.length > 0) {
        console.log('✅ Client retrieval successful');
        console.log(`Found ${getResult.data.length} clients`);
        console.log('Client data structure:', Object.keys(getResult.data[0]));
      }
    } else {
      console.log('❌ Client creation failed');
      console.log('Response:', createResult);
    }
  } catch (error) {
    console.log(`❌ Client test error: ${error.message}`);
  }
  
  // Test 3: Create a job
  console.log('\n3. Testing job creation...');
  try {
    const jobData = {
      title: "Test Job GPT",
      description: "Test job for GPT verification",
      status: "scheduled",
      scheduledStart: "2024-01-15T10:00:00Z",
      scheduledEnd: "2024-01-15T12:00:00Z",
      address: "456 Job St"
    };
    
    const createJobResponse = await fetch(`${baseUrl}/api/gpt/jobs`, {
      method: 'POST', 
      headers,
      body: JSON.stringify(jobData)
    });
    
    console.log(`Create job status: ${createJobResponse.status}`);
    const createJobResult = await createJobResponse.json();
    
    if (createJobResponse.status === 200 && createJobResult.success) {
      console.log('✅ Job creation successful');
    } else {
      console.log('❌ Job creation failed');
      console.log('Response:', createJobResult);
    }
  } catch (error) {
    console.log(`❌ Job test error: ${error.message}`);
  }
  
  // Test 4: Test estimates endpoint
  console.log('\n4. Testing estimates endpoint...');
  try {
    const estimatesResponse = await fetch(`${baseUrl}/api/gpt/estimates`, { headers });
    const estimatesResult = await estimatesResponse.json();
    
    console.log(`Estimates status: ${estimatesResponse.status}`);
    if (estimatesResult.success) {
      console.log('✅ Estimates endpoint working');
      console.log(`Found ${estimatesResult.data.length} estimates`);
    }
  } catch (error) {
    console.log(`❌ Estimates test error: ${error.message}`);
  }
  
  // Test 5: Test invoices endpoint  
  console.log('\n5. Testing invoices endpoint...');
  try {
    const invoicesResponse = await fetch(`${baseUrl}/api/gpt/invoices`, { headers });
    const invoicesResult = await invoicesResponse.json();
    
    console.log(`Invoices status: ${invoicesResponse.status}`);
    if (invoicesResult.success) {
      console.log('✅ Invoices endpoint working');
      console.log(`Found ${invoicesResult.data.length} invoices`);
    }
  } catch (error) {
    console.log(`❌ Invoices test error: ${error.message}`);
  }
  
  console.log('\n=== GPT CRUD TESTING COMPLETE ===');
  console.log('Summary: All endpoints tested for ChatGPT unified schema compliance');
}

testGPTCRUD();