const { execSync } = require('child_process');
const path = require('path');

try {
  // Get the absolute path to the vite executable
  const vitePath = path.resolve(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
  
  // Execute vite build using node directly
  execSync(`node "${vitePath}" build`, { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 