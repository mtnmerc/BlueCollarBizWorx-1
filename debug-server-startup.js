import { spawn } from 'child_process';

console.log('Starting server with detailed logging...');

const server = spawn('tsx', ['server/index.ts'], {
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'pipe'
});

server.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

server.on('error', (error) => {
  console.error('Server error:', error);
});

// Keep process alive for 10 seconds to capture startup
setTimeout(() => {
  console.log('Stopping debug server...');
  server.kill();
}, 10000);