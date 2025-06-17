import fs from 'fs';

const schema = JSON.parse(fs.readFileSync('bizworx-proxy-schema.json', 'utf8'));

// Convert any remaining non-POST endpoints
Object.keys(schema.paths).forEach(path => {
  const pathObj = schema.paths[path];
  
  // Convert PUT to POST
  if (pathObj.put) {
    pathObj.post = {
      ...pathObj.put,
      summary: pathObj.put.summary.replace('Update', 'Update')
    };
    delete pathObj.put;
  }
  
  // Convert PATCH to POST  
  if (pathObj.patch) {
    pathObj.post = {
      ...pathObj.patch,
      summary: pathObj.patch.summary.replace('Update', 'Update')
    };
    delete pathObj.patch;
  }
  
  // Convert any remaining GET to POST
  if (pathObj.get) {
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

fs.writeFileSync('bizworx-proxy-schema.json', JSON.stringify(schema, null, 2));
console.log('✅ All endpoints converted to POST method');