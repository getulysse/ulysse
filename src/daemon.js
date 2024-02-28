import fs from 'fs';
import net from 'net';
import { exec } from 'child_process';
import { io } from 'socket.io-client';
import {
    config,
    isSudo,
    editConfig,
    updateResolvConf,
    sendNotification,
    getRunningBlockedApps,
} from './utils';
import { SOCKET_PATH, SERVER_HOST } from './constants';

const socket = io(SERVER_HOST);

const handleAppBlocking = () => {
    const blockedApps = getRunningBlockedApps();

    for (const app of blockedApps) {
        exec(`kill -9 ${app.pid}`);
        console.log(`Blocking ${app.name}`);
        sendNotification('Ulysse', `Blocking ${app.name}`);
    }
};

const handleSynchronize = () => {
    socket.emit('synchronize', config);
};

const handleTimeout = () => {
    const blocklist = config?.blocklist.filter(({ timeout }) => {
        if (!timeout) return true;
        return timeout >= Math.floor(Date.now() / 1000);
    });

    if (blocklist?.length === config?.blocklist.length) return;

    editConfig({ ...config, blocklist });
};

const server = net.createServer((connection) => {
    let buffer = '';

    connection.on('data', (data) => {
        buffer += data.toString();
    });

    connection.on('end', () => {
        const newConfig = JSON.parse(buffer);
        const password = !config.shield ? newConfig?.password : undefined;
        socket.emit('synchronize', {
            ...editConfig({ ...newConfig, date: new Date().toISOString() }),
            password,
        });
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
    handleTimeout();
    handleSynchronize();
}, 60000);

handleTimeout();
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

socket.on('synchronize', (newConfig) => {
    if (new Date(newConfig.date) > new Date(config.date)) {
        editConfig(newConfig);
        console.log('Synchronize...');
    }
});

if (process.env.NODE_ENV !== 'test') {
    import('./dns');
}
