#!/usr/bin/env node

import { fileURLToPath } from 'url';
import main from './main.js';

// Check if this module is being run directly (not imported)
// This handles various ways the binary can be executed (npx, global install, direct node call)
const isMainModule =
  import.meta.url.startsWith('file:') &&
  (process.argv[1] === fileURLToPath(import.meta.url) ||
    process.argv[1].endsWith('/index.js') ||
    process.argv[1].endsWith('uvkill'));

if (isMainModule) {
  main();
}

export * from './core/index.js';
