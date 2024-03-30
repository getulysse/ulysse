import { exec } from 'child_process';
import {
    config,
    isSudo,
    editConfig,
    updateResolvConf,
    sendNotification,
    getRunningBlockedApps,
} from './utils';

if (!isSudo()) {
    console.error('You must run this command with sudo.');
    process.exit(1);
}

const handleAppBlocking = () => {
    const blockedApps = getRunningBlockedApps();

    for (const app of blockedApps) {
        exec(`kill -9 ${app.pid}`);
        console.log(`Blocking ${app.name}`);
        sendNotification('Ulysse', `Blocking ${app.name}`);
    }
};

const handleTimeout = () => {
    const blocklist = config?.blocklist.filter(({ timeout }) => {
        if (!timeout) return true;
        return timeout >= Math.floor(Date.now() / 1000);
    });

    if (blocklist?.length === config?.blocklist.length) return;

    editConfig({ ...config, blocklist });
};

const cleanUpAndExit = () => {
    updateResolvConf();
    process.exit(0);
};

setInterval(() => {
    handleAppBlocking();
}, 1000);

setInterval(() => {
    handleTimeout();
}, 60000);

console.log('Starting daemon...');
updateResolvConf('127.0.0.1');
handleTimeout();
handleAppBlocking();

process.on('SIGINT', cleanUpAndExit);
process.on('SIGTERM', cleanUpAndExit);

import('./socket');
import('./sync');
import('./dns');
