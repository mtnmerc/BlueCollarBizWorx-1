import { promises as fs } from 'fs';

async function validateChatGPTSchemas() {
  console.log('=== VALIDATING CHATGPT SCHEMA FILES ===\n');
  
  const schemaFiles = [
    'chatgpt-clients-tools.json',
    'chatgpt-jobs-tools.json', 
    'chatgpt-invoice-tools.json',
    'chatgpt-estimate-tools.json',
    'chatgpt-dashboard-tools.json'
  ];
  
  let allValid = true;
  
  for (const file of schemaFiles) {
    try {
      console.log(`Validating ${file}...`);
      const content = await fs.readFile(file, 'utf8');
      const schema = JSON.parse(content);
      
      // Check OpenAPI version
      const hasCorrectVersion = schema.openapi === '3.1.0';
      console.log(`  OpenAPI 3.1.0: ${hasCorrectVersion ? '✅' : '❌'}`);
      
      // Check components section structure
      const hasComponents = schema.components && typeof schema.components === 'object';
      const hasSchemas = hasComponents && schema.components.schemas && typeof schema.components.schemas === 'object';
      const hasSecuritySchemes = hasComponents && schema.components.securitySchemes;
      
      console.log(`  Components section: ${hasComponents ? '✅' : '❌'}`);
      console.log(`  Schemas subsection: ${hasSchemas ? '✅' : '❌'}`);
      console.log(`  Security schemes: ${hasSecuritySchemes ? '✅' : '❌'}`);
      
      // Check X-API-Key authentication
      const hasApiKeyAuth = hasSecuritySchemes && 
        schema.components.securitySchemes.ApiKeyAuth &&
        schema.components.securitySchemes.ApiKeyAuth.type === 'apiKey' &&
        schema.components.securitySchemes.ApiKeyAuth.name === 'X-API-Key';
      
      console.log(`  X-API-Key auth: ${hasApiKeyAuth ? '✅' : '❌'}`);
      
      // Check security array
      const hasSecurity = Array.isArray(schema.security) && 
        schema.security.some(s => s.ApiKeyAuth);
      
      console.log(`  Security applied: ${hasSecurity ? '✅' : '❌'}`);
      
      if (!hasCorrectVersion || !hasComponents || !hasSchemas || !hasSecuritySchemes || !hasApiKeyAuth || !hasSecurity) {
        allValid = false;
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ ${file}: JSON parsing failed - ${error.message}`);
      allValid = false;
    }
  }
  
  console.log('=== VALIDATION SUMMARY ===');
  if (allValid) {
    console.log('✅ ALL SCHEMAS VALID FOR CHATGPT CUSTOM GPT');
    console.log('✅ Components section properly structured');
    console.log('✅ X-API-Key authentication configured');
    console.log('✅ OpenAPI 3.1.0 format maintained');
    console.log('\n🎉 Ready for ChatGPT Custom GPT integration!');
  } else {
    console.log('❌ Some schemas have validation errors');
    console.log('Please check the issues above and fix them');
  }
}

validateChatGPTSchemas();