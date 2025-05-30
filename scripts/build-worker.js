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

// Create a browser-compatible bundle for the worker using esbuild
console.log('Creating transformers-js worker bundle...');
execSync(
  'npx esbuild src/providers/transformers-js/worker.ts --bundle --format=iife --platform=browser --target=es2020 --outfile=dist/transformers-js.js',
  { stdio: 'inherit' }
);

console.log('Worker bundle created at dist/transformers-js.js');

// Gere um módulo que exporta o código do worker como string
const workerCode = fs.readFileSync('dist/transformers-js.js', 'utf-8');
fs.writeFileSync(
  'src/providers/transformers-js/worker-string.ts',
  `const workerCode = ${JSON.stringify(workerCode)};\nexport default workerCode;\n`
);
console.log('Worker string module created at src/providers/transformers-js/worker-string.ts');