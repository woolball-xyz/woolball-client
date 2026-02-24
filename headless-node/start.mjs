import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

const WS_URL = process.env.VITE_WEBSOCKET_URL || 'ws://host.docker.internal:9003/ws';
const NODE_COUNT = parseInt(process.env.NODE_COUNT || '1', 10);
const STATIC_DIR = process.env.STATIC_DIR || '/app/browser-ui';
const PORT = 8787;

console.log(`[headless-node] WebSocket URL: ${WS_URL}`);
console.log(`[headless-node] Node count: ${NODE_COUNT}`);
console.log(`[headless-node] Serving UI from: ${STATIC_DIR}`);

// Simple static file server
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Serve env-config.js dynamically
      if (req.url === '/env-config.js') {
        res.writeHead(200, { 'Content-Type': 'text/javascript' });
        res.end(`window.ENV_CONFIG = {
  VITE_WEBSOCKET_URL: "${WS_URL}",
  VITE_API_URL: "${process.env.VITE_API_URL || 'http://localhost:9002/api/v1'}"
};`);
        return;
      }

      let filePath = path.join(STATIC_DIR, req.url === '/' ? 'index.html' : req.url);

      // SPA fallback
      if (!fs.existsSync(filePath)) {
        filePath = path.join(STATIC_DIR, 'index.html');
      }

      const ext = path.extname(filePath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      try {
        const content = fs.readFileSync(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(PORT, () => {
      console.log(`[headless-node] Static server on http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

async function main() {
  const server = await startStaticServer();

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-unsafe-webgpu',
      '--enable-features=Vulkan',
      '--disable-vulkan-surface',
    ],
  });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    console.log(`[browser] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    console.error(`[browser error] ${err.message}`);
  });

  // Navigate to the locally served browser-ui
  console.log('[headless-node] Opening browser-ui...');
  await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });

  // Set node count if > 1
  if (NODE_COUNT > 1) {
    // The NodeSelector component has a select or input for node count
    // Try to find and set it
    try {
      await page.evaluate((count) => {
        // Look for node count buttons/input in the UI
        const buttons = document.querySelectorAll('button');
        // The NodeSelector has + and - buttons to change count
        for (let i = 1; i < count; i++) {
          const plusBtn = Array.from(buttons).find(b => b.textContent?.includes('+'));
          if (plusBtn) plusBtn.click();
        }
      }, NODE_COUNT);
      console.log(`[headless-node] Set node count to ${NODE_COUNT}`);
    } catch (e) {
      console.warn(`[headless-node] Could not set node count: ${e.message}`);
    }
  }

  // Click the START button
  console.log('[headless-node] Clicking START...');
  try {
    await page.evaluate(() => {
      const btn = document.querySelector('.main-action-btn.start');
      if (btn) {
        btn.click();
        return true;
      }
      // Fallback: find any button with START text
      const buttons = document.querySelectorAll('button');
      for (const b of buttons) {
        if (b.textContent?.trim() === 'START') {
          b.click();
          return true;
        }
      }
      throw new Error('START button not found');
    });
    console.log('[headless-node] START clicked. Woolball nodes are running.');
  } catch (e) {
    console.error(`[headless-node] Failed to click START: ${e.message}`);
    await browser.close();
    server.close();
    process.exit(1);
  }

  // Keep alive and handle shutdown
  const shutdown = async () => {
    console.log('[headless-node] Shutting down...');
    await browser.close();
    server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep alive
  await new Promise(() => {});
}

main().catch((err) => {
  console.error('[headless-node] Fatal error:', err);
  process.exit(1);
});
