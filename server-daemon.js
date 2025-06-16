import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

console.log('Starting BizWorx server daemon...');

let server;

function startServer() {
  server = spawn('npx', ['tsx', 'server/index.ts'], {
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '5000'
    },
    stdio: 'pipe'
  });

  server.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output);
    
    // Write to log file
    writeFileSync('/tmp/bizworx.log', output, { flag: 'a' });
  });

  server.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(error);
    writeFileSync('/tmp/bizworx.log', `ERROR: ${error}`, { flag: 'a' });
  });

  server.on('exit', (code) => {
    if (code !== 0) {
      console.log(`Server exited with code ${code}, restarting in 2 seconds...`);
      setTimeout(startServer, 2000);
    }
  });

  server.on('error', (err) => {
    console.error('Server spawn error:', err);
    setTimeout(startServer, 2000);
  });
}

startServer();

// Keep daemon alive
setInterval(() => {
  // Health check
}, 30000);

process.on('SIGTERM', () => {
  if (server) server.kill();
  process.exit(0);
});

process.on('SIGINT', () => {
  if (server) server.kill();
  process.exit(0);
});