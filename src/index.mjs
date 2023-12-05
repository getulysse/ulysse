#!/usr/bin/env node

import { checkDaemon, checkRoot, installDaemon, blockDevices, restartBrowsers, sendWebhook } from './utils.mjs';

const params = process.argv.slice(2);

if (params.includes('--help') || params.includes('-h')) {
    console.log('Usage: ulysse [daemon|server]');
    process.exit(0);
}

if (params.includes('server')) {
    await import('./server.mjs');
}

if (params.includes('daemon')) {
    await import('./daemon.mjs');
    await import('./dns.mjs');
}

if (!params.includes('server') && !params.includes('daemon')) {
    await installDaemon();
    await checkRoot();
    await checkDaemon();
    await blockDevices();
    await restartBrowsers();
    await sendWebhook({ action: 'block' });
    process.exit(0);
}
