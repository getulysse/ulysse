import { io } from 'socket.io-client';
import { blockRoot, blockApps, blockHosts, unBlockRoot, unBlockApps, unBlockHosts } from './utils.mjs'; // eslint-disable-line

const SERVER = process.env.SERVER || 'http://localhost:3000';

const params = process.argv.slice(2);

if (process.getuid() !== 0) {
    console.error('Please run this script as root or using sudo'); // eslint-disable-line
    process.exit(1);
}

if (params.includes('block')) {
    console.log('Blocking...');
    await blockRoot();
    await blockApps();
    await blockHosts();
    process.exit(0);
}

const socket = io(SERVER);

socket.on('connect', () => {
    console.log('Connected to the server');
});

socket.on('unblock', async () => {
    console.log('Unblocking...');
    await unBlockRoot();
    await unBlockApps();
    await unBlockHosts();
});
