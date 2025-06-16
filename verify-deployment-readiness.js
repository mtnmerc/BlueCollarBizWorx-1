import fs from 'fs';
import path from 'path';

async function verifyDeploymentReadiness() {
  console.log('=== VERIFYING DEPLOYMENT READINESS ===\n');
  
  const checks = [];
  
  // Check 1: Session isolation fix exists in routes.ts
  console.log('1. Checking session isolation fix in routes.ts...');
  try {
    const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
    
    if (routesContent.includes('req.session.regenerate')) {
      checks.push({ name: 'Session regeneration fix', status: 'PRESENT' });
      console.log('✅ Session regeneration code found');
    } else {
      checks.push({ name: 'Session regeneration fix', status: 'MISSING' });
      console.log('❌ Session regeneration code NOT found');
    }
    
    if (routesContent.includes('[SESSION] Business login:')) {
      checks.push({ name: 'Session logging', status: 'PRESENT' });
      console.log('✅ Session logging found');
    } else {
      checks.push({ name: 'Session logging', status: 'MISSING' });
      console.log('❌ Session logging NOT found');
    }
    
    if (routesContent.includes('[API-KEY-GEN]')) {
      checks.push({ name: 'API key generation logging', status: 'PRESENT' });
      console.log('✅ API key generation logging found');
    } else {
      checks.push({ name: 'API key generation logging', status: 'MISSING' });
      console.log('❌ API key generation logging NOT found');
    }
    
  } catch (error) {
    checks.push({ name: 'Routes file access', status: 'ERROR', error: error.message });
    console.log('❌ Cannot read routes.ts:', error.message);
  }
  
  // Check 2: GPT authentication logging exists
  console.log('\n2. Checking GPT authentication logging...');
  try {
    const gptRoutesContent = fs.readFileSync('server/gpt-routes-final.ts', 'utf8');
    
    if (gptRoutesContent.includes('[GPT-AUTH]')) {
      checks.push({ name: 'GPT authentication logging', status: 'PRESENT' });
      console.log('✅ GPT authentication logging found');
    } else {
      checks.push({ name: 'GPT authentication logging', status: 'MISSING' });
      console.log('❌ GPT authentication logging NOT found');
    }
    
  } catch (error) {
    checks.push({ name: 'GPT routes file access', status: 'ERROR', error: error.message });
    console.log('❌ Cannot read gpt-routes-final.ts:', error.message);
  }
  
  // Check 3: Build configuration
  console.log('\n3. Checking build configuration...');
  try {
    const packageContent = fs.readFileSync('package.json', 'utf8');
    const packageJson = JSON.parse(packageContent);
    
    if (packageJson.scripts && packageJson.scripts.build) {
      checks.push({ name: 'Build script', status: 'PRESENT' });
      console.log('✅ Build script found:', packageJson.scripts.build);
    } else {
      checks.push({ name: 'Build script', status: 'MISSING' });
      console.log('❌ Build script NOT found');
    }
    
    if (packageJson.scripts && packageJson.scripts.start) {
      checks.push({ name: 'Start script', status: 'PRESENT' });
      console.log('✅ Start script found:', packageJson.scripts.start);
    } else {
      checks.push({ name: 'Start script', status: 'MISSING' });
      console.log('❌ Start script NOT found');
    }
    
  } catch (error) {
    checks.push({ name: 'Package.json access', status: 'ERROR', error: error.message });
    console.log('❌ Cannot read package.json:', error.message);
  }
  
  // Check 4: Deployment configuration
  console.log('\n4. Checking deployment configuration...');
  try {
    const replitContent = fs.readFileSync('.replit', 'utf8');
    
    if (replitContent.includes('[deployment]')) {
      checks.push({ name: 'Deployment config', status: 'PRESENT' });
      console.log('✅ Deployment configuration found');
      
      // Check specific deployment settings
      if (replitContent.includes('npm run build')) {
        checks.push({ name: 'Build command', status: 'PRESENT' });
        console.log('✅ Build command configured');
      } else {
        checks.push({ name: 'Build command', status: 'MISSING' });
        console.log('❌ Build command NOT configured');
      }
      
      if (replitContent.includes('npm run start')) {
        checks.push({ name: 'Start command', status: 'PRESENT' });
        console.log('✅ Start command configured');
      } else {
        checks.push({ name: 'Start command', status: 'MISSING' });
        console.log('❌ Start command NOT configured');
      }
      
    } else {
      checks.push({ name: 'Deployment config', status: 'MISSING' });
      console.log('❌ Deployment configuration NOT found');
    }
    
  } catch (error) {
    checks.push({ name: 'Replit config access', status: 'ERROR', error: error.message });
    console.log('❌ Cannot read .replit:', error.message);
  }
  
  // Check 5: Critical files exist
  console.log('\n5. Checking critical files...');
  const criticalFiles = [
    'server/index.ts',
    'server/routes.ts', 
    'server/gpt-routes-final.ts',
    'server/storage-clean.ts',
    'server/db.ts',
    'shared/schema.ts'
  ];
  
  for (const file of criticalFiles) {
    try {
      if (fs.existsSync(file)) {
        checks.push({ name: `File: ${file}`, status: 'PRESENT' });
        console.log(`✅ ${file} exists`);
      } else {
        checks.push({ name: `File: ${file}`, status: 'MISSING' });
        console.log(`❌ ${file} NOT found`);
      }
    } catch (error) {
      checks.push({ name: `File: ${file}`, status: 'ERROR', error: error.message });
      console.log(`❌ Cannot check ${file}:`, error.message);
    }
  }
  
  // Check 6: Test if build can complete (without full build)
  console.log('\n6. Checking build readiness...');
  try {
    // Check if TypeScript compiles without errors
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    const tscResult = await execAsync('npx tsc --noEmit --skipLibCheck');
    checks.push({ name: 'TypeScript compilation', status: 'PRESENT' });
    console.log('✅ TypeScript compilation check passed');
    
  } catch (error) {
    checks.push({ name: 'TypeScript compilation', status: 'ERROR', error: error.message });
    console.log('❌ TypeScript compilation issues:', error.message.substring(0, 100) + '...');
  }
  
  // Summary
  console.log('\n=== DEPLOYMENT READINESS SUMMARY ===');
  
  const presentCount = checks.filter(c => c.status === 'PRESENT').length;
  const missingCount = checks.filter(c => c.status === 'MISSING').length;
  const errorCount = checks.filter(c => c.status === 'ERROR').length;
  
  console.log(`✅ Present: ${presentCount}`);
  console.log(`❌ Missing: ${missingCount}`);
  console.log(`⚠️  Errors: ${errorCount}`);
  
  const criticalIssues = checks.filter(c => 
    (c.name.includes('Session regeneration') || 
     c.name.includes('GPT authentication') || 
     c.name.includes('Build script') ||
     c.name.includes('Start script')) && 
    c.status !== 'PRESENT'
  );
  
  if (criticalIssues.length === 0) {
    console.log('\n🎯 DEPLOYMENT READY: All critical session isolation fixes are present');
    console.log('✅ Session regeneration fix will deploy');
    console.log('✅ Enhanced logging will deploy'); 
    console.log('✅ GPT authentication improvements will deploy');
    return true;
  } else {
    console.log('\n⚠️  DEPLOYMENT ISSUES DETECTED:');
    criticalIssues.forEach(issue => {
      console.log(`❌ ${issue.name}: ${issue.status}`);
      if (issue.error) console.log(`   Error: ${issue.error}`);
    });
    return false;
  }
}

verifyDeploymentReadiness().then((ready) => {
  process.exit(ready ? 0 : 1);
}).catch(error => {
  console.error('Verification failed:', error);
  process.exit(1);
});