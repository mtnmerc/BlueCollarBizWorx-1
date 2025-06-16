#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting BizWorx development server...');

// Kill any existing processes
try {
  spawn('pkill', ['-f', 'tsx'], { stdio: 'ignore' });
  await new Promise(resolve => setTimeout(resolve, 1000));
} catch (e) {
  // Ignore errors
}

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    PORT: '5000'
  },
  stdio: 'inherit',
  cwd: __dirname,
  detached: false
});

server.on('spawn', () => {
  console.log('✅ Development server started on port 5000');
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  if (code !== 0) {
    console.log('🔄 Restarting server...');
    setTimeout(() => {
      spawn('node', [__filename], { 
        stdio: 'inherit', 
        detached: true 
      }).unref();
    }, 2000);
  }
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
  process.exit(0);
});