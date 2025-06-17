import fs from 'fs';

function listAllSchemaActions() {
  console.log('📋 BizWorx API Schema - All Available Actions\n');
  
  const schema = JSON.parse(fs.readFileSync('bizworx-proxy-schema.json', 'utf8'));
  
  const actions = [];
  
  Object.keys(schema.paths).forEach(path => {
    const pathObj = schema.paths[path];
    
    Object.keys(pathObj).forEach(method => {
      const operation = pathObj[method];
      actions.push({
        path: path,
        method: method.toUpperCase(),
        operationId: operation.operationId,
        summary: operation.summary,
        description: operation.description
      });
    });
  });
  
  // Group by category
  const categories = {
    'Client Management': actions.filter(a => a.path.includes('/clients')),
    'Estimate Management': actions.filter(a => a.path.includes('/estimates')),
    'Invoice Management': actions.filter(a => a.path.includes('/invoices')),
    'Job Management': actions.filter(a => a.path.includes('/jobs'))
  };
  
  Object.keys(categories).forEach(category => {
    if (categories[category].length > 0) {
      console.log(`\n🔧 ${category}`);
      console.log('='.repeat(category.length + 4));
      
      categories[category].forEach(action => {
        console.log(`\n${action.method} ${action.path}`);
        console.log(`  Operation: ${action.operationId}`);
        console.log(`  Summary: ${action.summary}`);
        if (action.description && action.description !== action.summary) {
          console.log(`  Description: ${action.description}`);
        }
      });
    }
  });
  
  console.log(`\n📊 Total Actions: ${actions.length}`);
  console.log(`\n🔑 Authentication: All actions require API key in request body`);
  console.log(`📝 Format: All requests use POST method with JSON body`);
  
  return actions;
}

listAllSchemaActions();