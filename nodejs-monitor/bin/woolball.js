#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import process from 'process';

import '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function showHelp() {
    console.log(`
🐑 Woolball Monitor CLI

Usage: woolball [options]

Options:
  --url, -u <url>     WebSocket server URL (default: ws://localhost:9003/ws)
  --help, -h          Show this help
  --version, -v       Show version

In-app commands:
  h                   Show help
  c                   Clear completed tasks
  q, Ctrl+C           Exit
`);
}

function showVersion() {
    try {
        const packagePath = join(__dirname, '..', 'package.json');
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
        console.log(`woolball v${packageJson.version}`);
    } catch (error) {
        console.log('woolball v1.0.0');
    }
}

const args = process.argv.slice(2);

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
        case '--help':
        case '-h':
            showHelp();
            process.exit(0);
            break;
            
        case '--version':
        case '-v':
            showVersion();
            process.exit(0);
            break;
            
        case '--url':
        case '-u':
            if (i + 1 < args.length) {
                process.env.WOOLBALL_WS_URL = args[i + 1];
                i++;
            } else {
                console.error('Error: --url requires a value');
                process.exit(1);
            }
            break;
            
        default:
            if (arg.startsWith('-')) {
                console.error(`Error: Unknown option '${arg}'`);
                console.error('Use --help to see available options.');
                process.exit(1);
            }
            break;
    }
}

console.log('🐑 Starting Woolball Monitor...');