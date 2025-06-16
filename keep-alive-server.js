import { exec } from 'child_process';

console.log('Starting BizWorx development server with keep-alive...');

const startServer = () => {
  const server = exec('NODE_ENV=development PORT=5000 npx tsx server/index.ts', (error, stdout, stderr) => {
    if (error) {
      console.error('Server error:', error);
      setTimeout(startServer, 2000); // Restart after 2 seconds
    }
  });

  server.stdout.on('data', (data) => {
    console.log(data.toString().trim());
  });

  server.stderr.on('data', (data) => {
    console.error(data.toString().trim());
  });

  return server;
};

const serverProcess = startServer();

// Keep the main process alive
setInterval(() => {
  // Ping to keep alive
}, 30000);

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  serverProcess.kill();
  process.exit(0);
});