#!/usr/bin/env node

import { blockRoot, blockApps, blockHosts, checkDaemon, checkRoot, installDaemon } from './utils.mjs';

const params = process.argv.slice(2);

if (params.includes('--help') || params.includes('-h')) {
    console.log('Usage: ulysse');
    process.exit(0);
}

await installDaemon();

if (params.includes('server')) {
    await import('./server.mjs');
}

if (params.includes('daemon')) {
    await import('./daemon.mjs');
}

if (params.length === 0) {
    await checkRoot();
    await checkDaemon();
    await blockRoot();
    await blockApps();
    await blockHosts();
}
