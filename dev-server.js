#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting BizWorx Development Server...');

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5000'
  },
  stdio: 'inherit'
});

server.on('spawn', () => {
  console.log('✅ Server process spawned successfully');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code} and signal ${signal}`);
    process.exit(code);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⏹️  Shutting down server...');
  server.kill('SIGTERM');
  setTimeout(() => server.kill('SIGKILL'), 5000);
});

process.on('SIGTERM', () => {
  server.kill('SIGTERM');
});