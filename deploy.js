#!/usr/bin/env node

// Deploy script that bypasses complex build process
import { execSync } from 'child_process';

console.log('Starting deployment...');

try {
  // Just build the frontend without the complex server bundle
  console.log('Building frontend...');
  execSync('npx vite build --outDir=dist/client', { stdio: 'inherit' });
  
  console.log('Deployment ready!');
  console.log('Frontend built to dist/client');
  console.log('Server will run directly from TypeScript');
  
} catch (error) {
  console.error('Deployment failed:', error.message);
  process.exit(1);
}