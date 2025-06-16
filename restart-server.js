import { spawn } from 'child_process';

console.log('Starting development server...');

const server = spawn('npx', ['tsx', 'server/index.ts'], {
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    PORT: '5000'
  },
  stdio: 'inherit'
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

// Keep process alive
setInterval(() => {}, 1000);