import fs from 'fs';
import net from 'net';
import { io } from 'socket.io-client';
import {
    isSudo,
    blockApps,
    readConfig,
    editConfig,
    updateResolvConf,
    sendNotification,
} from './utils';
import { SOCKET_PATH, SERVER_HOST } from './constants';

const socket = io(SERVER_HOST);

const handleAppBlocking = () => {
    const blockedApps = blockApps();

    for (const appName of blockedApps) {
        console.log(`Blocking ${appName}`);
        sendNotification('Ulysse', `Blocking ${appName}`);
    }
};

const server = net.createServer((connection) => {
    connection.on('data', (config) => {
        const data = JSON.parse(config);
        const newConfig = editConfig(data);
        const password = !data.shield ? data?.password : undefined;
        socket.emit('synchronize', { ...newConfig, password });
    });
});

const cleanUpAndExit = () => {
    updateResolvConf();
    process.exit(0);
};

if (!isSudo()) {
    console.error('You must run this command with sudo.');
    process.exit(1);
}

console.log('Starting daemon...');

updateResolvConf('127.0.0.1');

if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);

setInterval(() => {
    handleAppBlocking();
}, 1000);

setInterval(() => {
    const config = readConfig();
    socket.emit('synchronize', config);
}, 60000);

handleAppBlocking();

process.on('SIGINT', cleanUpAndExit);
process.on('SIGTERM', cleanUpAndExit);

server.listen(SOCKET_PATH, () => {
    const uid = Number(process.env.SUDO_UID || process.getuid());
    const gid = Number(process.env.SUDO_GID || process.getgid());
    fs.chownSync(SOCKET_PATH, uid, gid);
});

socket.on('connect', () => {
    console.log('Connected to the server');
});

socket.on('synchronize', async (newConfig) => {
    const currentConfig = readConfig();

    if (new Date(newConfig.date) > new Date(currentConfig.date)) {
        console.log('Synchronize...');
        await editConfig(newConfig);
    }
});

if (process.env.NODE_ENV !== 'test') {
    import('./dns');
}
