const { spawn } = require('child_process');

console.log('Starting BizWorx server for ChatGPT integration...');

const server = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  cwd: process.cwd()
});

server.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
});

console.log('Server starting on http://localhost:5000');
console.log('Use this URL in your ChatGPT Custom GPT schema');