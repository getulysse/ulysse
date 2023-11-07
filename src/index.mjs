#!/usr/bin/env node

import { checkDaemon, checkRoot, installDaemon, blockDevices, restartBrowsers } from './utils.mjs';

const params = process.argv.slice(2);

if (params.includes('--help') || params.includes('-h')) {
    console.log('Usage: ulysse [block|daemon|server]');
    process.exit(0);
}

if (params.includes('server')) {
    await import('./server.mjs');
}

if (params.includes('daemon')) {
    await import('./daemon.mjs');
    await import('./dns.mjs');
}

if (params.length === 0 || params.includes('block')) {
    await installDaemon();
    await checkRoot();
    await checkDaemon();
    await blockDevices();
    await restartBrowsers();
    process.exit(0);
}
