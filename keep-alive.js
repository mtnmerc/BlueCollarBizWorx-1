// Simple keep-alive script to prevent Replit from sleeping
const http = require('http');

const PING_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SERVER_URL = 'http://localhost:5000';

function pingServer() {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`Keep-alive ping: ${res.statusCode} at ${new Date().toISOString()}`);
  });

  req.on('error', (err) => {
    console.log(`Keep-alive error: ${err.message} at ${new Date().toISOString()}`);
  });

  req.on('timeout', () => {
    req.destroy();
    console.log(`Keep-alive timeout at ${new Date().toISOString()}`);
  });

  req.end();
}

// Start pinging immediately and then every interval
pingServer();
setInterval(pingServer, PING_INTERVAL);

console.log(`Keep-alive started, pinging every ${PING_INTERVAL/1000} seconds`);
console.log('This will help prevent your BizWorx server from sleeping');