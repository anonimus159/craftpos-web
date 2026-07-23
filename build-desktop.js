const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiPath = path.join(__dirname, 'src', 'app', 'api');
const apiTempPath = path.join(__dirname, 'src', 'app', '_api');

function renameSync(oldPath, newPath) {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
}

console.log('--- Preparing Desktop Build ---');
// Temporarily hide API routes from Next.js static export
console.log('Hiding API routes...');
renameSync(apiPath, apiTempPath);

try {
  console.log('Running next build...');
  execSync('npx next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed', error);
  // Restore API routes before exiting with error
  renameSync(apiTempPath, apiPath);
  process.exit(1);
}

// Restore API routes
console.log('Restoring API routes...');
renameSync(apiTempPath, apiPath);
console.log('--- Desktop Build Complete ---');
