#!/usr/bin/env node

import { io } from 'socket.io-client';
import { blockRoot, blockApps, blockHosts, unBlockRoot, unBlockApps, unBlockHosts, checkDaemon, config } from './utils.mjs'; // eslint-disable-line

const params = process.argv.slice(2);

if (params.includes('--server')) {
    console.log('Starting server...');
    await import('./server.mjs'); // eslint-disable-line
}

if (process.getuid() !== 0 && !params.includes('--server')) {
    console.error('Please run this script as root or using sudo'); // eslint-disable-line
    process.exit(1);
}

if (params.includes('--block')) {
    console.log('Blocking...');
    await checkDaemon();
    await blockRoot();
    await blockApps();
    await blockHosts();
    process.exit(0);
}

if (params.includes('--unblock')) {
    console.log('Unblocking...');
    await unBlockRoot();
    await unBlockApps();
    await unBlockHosts();
    process.exit(0);
}

if (params.includes('--daemonize')) {
    console.log('Daemonizing...');
    const { server } = config;

    const socket = io(server);

    socket.on('connect', () => {
        console.log('Connected to the server');
    });

    socket.on('unblock', async () => {
        console.log('Unblocking...');
        await unBlockRoot();
        await unBlockApps();
        await unBlockHosts();
    });
}

if (params.length === 0) {
    console.log('Usage: sudo node index.mjs --block|--unblock|--daemonize|--server'); // eslint-disable-line
}
