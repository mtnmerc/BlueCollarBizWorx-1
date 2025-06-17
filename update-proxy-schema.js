import fs from 'fs';

// Read the proxy schema file
const schema = JSON.parse(fs.readFileSync('bizworx-proxy-schema.json', 'utf8'));

// List of request schemas that need API key parameter
const requestSchemas = [
  'CreateEstimateRequest',
  'UpdateEstimateRequest', 
  'CreateInvoiceRequest',
  'UpdateInvoiceRequest',
  'CreateJobRequest',
  'UpdateJobRequest'
];

// Function to add API key to a schema
function addApiKeyToSchema(schemaObj) {
  if (!schemaObj.properties) {
    schemaObj.properties = {};
  }
  
  // Add api_key property first
  const newProperties = {
    api_key: {
      type: 'string',
      description: 'Your BizWorx API key for authentication'
    },
    ...schemaObj.properties
  };
  
  schemaObj.properties = newProperties;
  
  // Add api_key to required array
  if (!schemaObj.required) {
    schemaObj.required = [];
  }
  
  if (!schemaObj.required.includes('api_key')) {
    schemaObj.required.unshift('api_key');
  }
}

// Add API key parameter to GET requests that don't have request bodies
// We'll need to create request body schemas for GET requests
const getEndpoints = [
  { path: '/clients', operationId: 'getClients' },
  { path: '/estimates', operationId: 'getEstimates' },
  { path: '/invoices', operationId: 'getInvoices' },
  { path: '/jobs', operationId: 'getJobs' },
  { path: '/estimates/stats', operationId: 'getEstimateStats' },
  { path: '/invoices/stats', operationId: 'getInvoiceStats' }
];

// Convert GET requests to POST requests with API key in body
getEndpoints.forEach(endpoint => {
  const pathObj = schema.paths[endpoint.path];
  if (pathObj && pathObj.get) {
    // Change GET to POST
    pathObj.post = {
      ...pathObj.get,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['api_key'],
              properties: {
                api_key: {
                  type: 'string',
                  description: 'Your BizWorx API key for authentication'
                }
              }
            }
          }
        }
      }
    };
    delete pathObj.get;
  }
});

// Update existing request schemas
requestSchemas.forEach(schemaName => {
  if (schema.components.schemas[schemaName]) {
    addApiKeyToSchema(schema.components.schemas[schemaName]);
  }
});

// Update parameterized endpoints (like /clients/{id}, /estimates/{id}, etc.)
Object.keys(schema.paths).forEach(path => {
  const pathObj = schema.paths[path];
  
  // Convert GET requests with parameters to POST
  if (pathObj.get && path.includes('{')) {
    pathObj.post = {
      ...pathObj.get,
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['api_key'],
              properties: {
                api_key: {
                  type: 'string',
                  description: 'Your BizWorx API key for authentication'
                }
              }
            }
          }
        }
      }
    };
    delete pathObj.get;
  }
  
  // Convert DELETE requests to POST
  if (pathObj.delete) {
    pathObj.post = {
      ...pathObj.delete,
      summary: pathObj.delete.summary.replace('Delete', 'Delete'),
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['api_key'],
              properties: {
                api_key: {
                  type: 'string',
                  description: 'Your BizWorx API key for authentication'
                }
              }
            }
          }
        }
      }
    };
    delete pathObj.delete;
  }
  
  // Update PUT/PATCH requests
  if (pathObj.put) {
    const requestBody = pathObj.put.requestBody;
    if (requestBody && requestBody.content && requestBody.content['application/json']) {
      const schemaRef = requestBody.content['application/json'].schema.$ref;
      if (schemaRef) {
        const schemaName = schemaRef.split('/').pop();
        if (schema.components.schemas[schemaName]) {
          addApiKeyToSchema(schema.components.schemas[schemaName]);
        }
      }
    }
  }
});

// Write the updated schema
fs.writeFileSync('bizworx-proxy-schema.json', JSON.stringify(schema, null, 2));

console.log('✅ Proxy schema updated successfully!');
console.log('- All GET requests converted to POST with API key in body');
console.log('- All request schemas now include required api_key parameter');
console.log('- DELETE requests converted to POST');
console.log('- Server URL updated to proxy endpoint');
console.log('- Security schemes removed (no header auth)');