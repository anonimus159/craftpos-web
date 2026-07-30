const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const apiPath = path.join(__dirname, 'src', 'app', 'api');
const apiTempPath = path.join(__dirname, 'src', 'app', '_api');

const catalogoPath = path.join(__dirname, 'src', 'app', 'catalogo');
const catalogoTempPath = path.join(__dirname, 'src', 'app', '_catalogo');

function renameSync(oldPath, newPath) {
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
  }
}

console.log('--- Preparing Desktop Build ---');
console.log('Hiding API and dynamic server routes...');
renameSync(apiPath, apiTempPath);
renameSync(catalogoPath, catalogoTempPath);

try {
  console.log('Running next build for Desktop...');
  execSync('npx next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed', error);
  renameSync(apiTempPath, apiPath);
  renameSync(catalogoTempPath, catalogoPath);
  process.exit(1);
}

console.log('Restoring API and dynamic server routes...');
renameSync(apiTempPath, apiPath);
renameSync(catalogoTempPath, catalogoPath);
console.log('--- Desktop Build Complete ---');
