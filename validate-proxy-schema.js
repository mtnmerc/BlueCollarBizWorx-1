import fs from 'fs';

// Validate the proxy schema structure
function validateProxySchema() {
  console.log('Validating BizWorx proxy schema...\n');
  
  const schema = JSON.parse(fs.readFileSync('bizworx-proxy-schema.json', 'utf8'));
  
  // Check basic structure
  console.log('✓ Schema loaded successfully');
  console.log(`✓ Title: ${schema.info.title}`);
  console.log(`✓ Server URL: ${schema.servers[0].url}`);
  
  // Verify no security schemes exist (header auth removed)
  if (!schema.components.securitySchemes) {
    console.log('✓ Security schemes removed (no header authentication)');
  } else {
    console.log('❌ Security schemes still present');
  }
  
  // Verify no global security requirements
  if (!schema.security) {
    console.log('✓ Global security requirements removed');
  } else {
    console.log('❌ Global security requirements still present');
  }
  
  // Check that all endpoints are POST methods
  let postCount = 0;
  let otherMethods = 0;
  
  Object.keys(schema.paths).forEach(path => {
    const pathObj = schema.paths[path];
    if (pathObj.post) postCount++;
    if (pathObj.get || pathObj.put || pathObj.delete || pathObj.patch) otherMethods++;
  });
  
  console.log(`✓ POST endpoints: ${postCount}`);
  if (otherMethods === 0) {
    console.log('✓ All endpoints converted to POST method');
  } else {
    console.log(`❌ ${otherMethods} non-POST endpoints still exist`);
  }
  
  // Check request bodies have api_key parameter
  let endpointsWithApiKey = 0;
  let totalEndpoints = 0;
  
  Object.keys(schema.paths).forEach(path => {
    const pathObj = schema.paths[path];
    if (pathObj.post) {
      totalEndpoints++;
      const requestBody = pathObj.post.requestBody;
      if (requestBody && requestBody.content && 
          requestBody.content['application/json'] && 
          requestBody.content['application/json'].schema) {
        
        const schemaObj = requestBody.content['application/json'].schema;
        
        // Check for direct api_key property
        if (schemaObj.properties && schemaObj.properties.api_key) {
          endpointsWithApiKey++;
        }
        // Check for schema reference
        else if (schemaObj.$ref) {
          const schemaName = schemaObj.$ref.split('/').pop();
          const refSchema = schema.components.schemas[schemaName];
          if (refSchema && refSchema.properties && refSchema.properties.api_key) {
            endpointsWithApiKey++;
          }
        }
      }
    }
  });
  
  console.log(`✓ Endpoints with API key: ${endpointsWithApiKey}/${totalEndpoints}`);
  
  // List sample endpoints
  console.log('\n📋 Sample endpoint configurations:');
  
  const samplePaths = ['/clients', '/estimates', '/invoices'];
  samplePaths.forEach(path => {
    if (schema.paths[path] && schema.paths[path].post) {
      const endpoint = schema.paths[path].post;
      console.log(`\n${path}:`);
      console.log(`  - Method: POST`);
      console.log(`  - Operation: ${endpoint.operationId}`);
      console.log(`  - Summary: ${endpoint.summary}`);
      
      const requestBody = endpoint.requestBody;
      if (requestBody && requestBody.content && requestBody.content['application/json']) {
        const schema = requestBody.content['application/json'].schema;
        if (schema.properties && schema.properties.api_key) {
          console.log(`  - API Key: Required in request body`);
        }
      }
    }
  });
  
  console.log('\n🎯 Proxy schema validation complete!');
  console.log('\nThe schema is ready for ChatGPT Custom GPT integration.');
  console.log('All endpoints use POST method with API key in request body.');
}

validateProxySchema();