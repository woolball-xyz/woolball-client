/**
 * Build script to create a browser-compatible version of the speech-to-text worker
 * This creates a standalone worker file that can be loaded directly in the browser
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure the dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Create a simple browser bundle for the worker using esbuild
console.log('Creating speech-to-text worker bundle...');
execSync(
  'npx esbuild src/models/speech-to-text/worker.ts --bundle --outfile=dist/worker-speech-to-text.js',
  { stdio: 'inherit' }
);

console.log('Worker bundle created at dist/worker-speech-to-text.js');