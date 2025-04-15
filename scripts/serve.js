/**
 * Simple HTTP server for serving the test page, demo page and library files
 * Used by Playwright for e2e testing and for the demo application
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Get the mode and port from command line arguments
const args = process.argv.slice(2);
const mode = args[0] || 'test';
const PORT = args[1] || process.env.PORT || 3000;

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  console.log(`Request: ${req.method} ${req.url}`);
  
  // Default to index.html for root path based on mode
  let filePath;
  if (req.url === '/') {
    filePath = mode === 'demo' 
      ? './demo/index.html' 
      : './e2e-tests/test-page/index.html';
  } else {
    filePath = '.' + req.url;
  }
  
  // Get the file extension
  const extname = path.extname(filePath);
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Read and serve the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('File not found');
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Success
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});