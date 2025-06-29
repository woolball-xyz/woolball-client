/**
 * Build script to create a browser-compatible version of the library
 * This creates a UMD bundle that can be loaded directly in the browser
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const esbuild = require('esbuild');
const nodeModulesPolyfill = require('./esbuild-plugin-node-modules-polyfill');

// Ensure the dist directory exists
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build the TypeScript code first
console.log('Building TypeScript...');
execSync('npm run build', { stdio: 'inherit' });

// Create a browser bundle using esbuild with our custom plugin
console.log('Creating browser bundle...');

// Usar a API do esbuild em vez do CLI para poder usar o plugin
esbuild.build({
  entryPoints: ['dist/index.js'],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  define: {
    'process.env.NODE_ENV': '"production"',
    'global': 'window'
  },
  outfile: 'dist/woolball.js',
  plugins: [nodeModulesPolyfill],
  external: ['node:*'],
}).catch((error) => {
  console.error('Error building browser bundle:', error);
  process.exit(1);
});

console.log('Browser bundle created at dist/woolball.js');
