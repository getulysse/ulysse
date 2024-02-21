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

const handleSynchronize = () => {
    const config = readConfig();
    socket.emit('synchronize', config);
};

const handleBlocklist = () => {
    const config = readConfig();

    const blocklist = config?.blocklist.filter(({ timeout }) => {
        if (!timeout) return true;
        return timeout >= Math.floor(Date.now() / 1000);
    });

    if (blocklist?.length === config?.blocklist.length) return;

    editConfig({ ...config, blocklist });
};

const server = net.createServer((connection) => {
    connection.on('data', (data) => {
        const config = JSON.parse(data);
        const password = !config.shield ? config?.password : undefined;
        const newConfig = editConfig({ ...config, date: new Date().toISOString() });
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
    handleBlocklist();
    handleSynchronize();
}, 60000);

handleBlocklist();
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
    const currentConfig = readConfig();

    if (new Date(newConfig.date) > new Date(currentConfig.date)) {
        editConfig(newConfig);
        console.log('Synchronize...');
    }
});

if (process.env.NODE_ENV !== 'test') {
    import('./dns');
}
