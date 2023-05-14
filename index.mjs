#!/usr/bin/env node

import { io } from 'socket.io-client';
import {
    blockRoot,
    blockApps,
    blockHosts,
    blockAllHosts,
    unBlockAllHosts,
    unBlockRoot,
    unBlockApps,
    unBlockHosts,
    clearBrowser,
    checkDaemon,
    sleep,
    config,
} from './utils.mjs';
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
    socket.emit('block', { params }, {}, async () => {
        await createTask();
        await clearBrowser();
        process.exit(0);
    });
}

if (params.includes('--daemon')) {
    console.log('Daemonizing...');

    const socket = io(server);
    const { blocklist, whitelist, apps } = config;

    socket.on('connect', () => {
        console.log('Connected to the server');
    });

    socket.on('block', async (parameters) => {
        console.log('Blocking...');
        await checkDaemon();
        await blockRoot();
        await blockApps(apps);
        await blockHosts(blocklist);

        if (parameters.includes('--all')) {
            await blockAllHosts(whitelist);
        }
    });

    socket.on('unblock', async () => {
        console.log('Unblocking...');
        await unBlockRoot();
        await unBlockApps(apps);
        await unBlockHosts();
        await unBlockAllHosts();
        await clearBrowser();
        await sleep(5000);
        await stopCurrentTask();
    });
}

if (params.length === 0) {
    console.log('Usage: sudo node index.mjs --block|--daemon|--server');
}
