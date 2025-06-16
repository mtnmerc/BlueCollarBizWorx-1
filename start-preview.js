import { spawn } from 'child_process';

console.log('Starting BizWorx preview server...');

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5000'
  },
  stdio: 'pipe'
});

server.stdout.on('data', (data) => {
  console.log(data.toString());
});

server.stderr.on('data', (data) => {
  console.error(data.toString());
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Keep the process alive
process.stdin.resume();