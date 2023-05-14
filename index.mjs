#!/usr/bin/env node

import { io } from 'socket.io-client';
import { blockRoot, blockApps, blockHosts, unBlockRoot, unBlockApps, unBlockHosts, clearBrowser, checkDaemon, sleep, config } from './utils.mjs';
import { createTask, stopCurrentTask } from './toggl.mjs';

const params = process.argv.slice(2);
const { server } = config;

if (params.includes('--server')) {
    console.log('Starting server...');
    await import('./server.mjs');
}

if (params.includes('--block')) {
    console.log('Blocking...');
    const socket = io(server);
    socket.emit('block', {}, {}, async () => {
        await createTask();
        await clearBrowser();
        process.exit(0);
    });
}

if (params.includes('--daemon')) {
    console.log('Daemonizing...');

    const socket = io(server);
    const { blocklist, apps } = config;

    socket.on('connect', () => {
        console.log('Connected to the server');
    });

    socket.on('block', async () => {
        console.log('Blocking...');
        await checkDaemon();
        await blockRoot();
        await blockApps(apps);
        await blockHosts(blocklist);
    });

    socket.on('unblock', async () => {
        console.log('Unblocking...');
        await unBlockRoot();
        await unBlockApps(apps);
        await unBlockHosts();
        await clearBrowser();
        await sleep(5000);
        await stopCurrentTask();
    });
}

if (params.length === 0) {
    console.log('Usage: sudo node index.mjs --block|--daemon|--server');
}
