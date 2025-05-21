// Simple script to start the server
console.log('Starting server...');

// Check if server directory exists
const fs = require('fs');
const path = require('path');

if (!fs.existsSync(path.join(__dirname, 'server'))) {
  console.error('Server directory not found. Make sure you are in the correct directory.');
  process.exit(1);
}

// Run the server
const child_process = require('child_process');
const server = child_process.spawn('node', ['server/index.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

console.log('Server started!');

// Handle process exit
process.on('SIGINT', () => {
  console.log('Stopping server...');
  server.kill('SIGINT');
  process.exit(0);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
}); 