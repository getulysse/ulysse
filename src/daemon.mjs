import { io } from 'socket.io-client';
import {
    blockRoot,
    blockApps,
    blockDns,
    unBlockRoot,
    unBlockApps,
    unBlockDns,
    checkRoot,
    config,
} from './utils.mjs';

const { server } = config;

await checkRoot();

console.log('Starting daemon...');

const socket = io(server);

socket.on('connect', () => console.log('Connected to the server'));

socket.on('block', async () => {
    console.log('Blocking...');
    await blockRoot();
    await blockApps();
    await blockDns();
});

socket.on('unblock', async () => {
    console.log('Unblocking...');
    await unBlockRoot();
    await unBlockApps();
    await unBlockDns();
});
