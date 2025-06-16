#!/usr/bin/env node

// Start the development server for preview
import { exec } from 'child_process';

console.log('Initializing BizWorx preview server...');

const serverProcess = exec('NODE_ENV=development PORT=5000 npx tsx server/index.ts', {
  cwd: process.cwd()
});

serverProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

serverProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

serverProcess.on('error', (error) => {
  console.error('Server error:', error);
});

// Keep process alive and handle signals
process.on('SIGINT', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGTERM', () => {
  serverProcess.kill('SIGTERM');
  process.exit(0);
});

// Prevent the process from exiting
process.stdin.resume();