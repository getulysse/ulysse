import fs from 'fs';
import net from 'net';
import {
    isSudo,
    blockApps,
    editConfig,
    unblockRoot,
    updateResolvConf,
    sendNotification,
} from './utils';
import { SOCKET_PATH } from './constants';

const handleAppBlocking = () => {
    const blockedApps = blockApps();

    for (const appName of blockedApps) {
        console.log(`Blocking ${appName}`);
        sendNotification('Ulysse', `Blocking ${appName}`);
    }
};

const server = net.createServer((connection) => {
    connection.on('data', (data) => {
        const newConfig = JSON.parse(data.toString());
        editConfig(newConfig);
    });
});

const cleanUpAndExit = () => {
    unblockRoot();
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

handleAppBlocking();

process.on('SIGINT', cleanUpAndExit);
process.on('SIGTERM', cleanUpAndExit);

server.listen(SOCKET_PATH, () => {
    const uid = Number(process.env.SUDO_UID || process.getuid());
    const gid = Number(process.env.SUDO_GID || process.getgid());
    fs.chownSync(SOCKET_PATH, uid, gid);
});

if (process.env.NODE_ENV !== 'test') {
    import('./dns');
}
