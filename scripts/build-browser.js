/**
 * Build script to create a browser-compatible version of the library
 * This creates a UMD bundle that can be loaded directly in the browser
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure the dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build the TypeScript code first
console.log('Building TypeScript...');
execSync('npm run build', { stdio: 'inherit' });

// Create a simple browser bundle using esbuild
console.log('Creating browser bundle...');
execSync(
  'npx esbuild dist/index.js --bundle --global-name=browserNode --outfile=dist/browser-node.js',
  { stdio: 'inherit' }
);

console.log('Browser bundle created at dist/browser-node.js');