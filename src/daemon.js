import {
    isSudo,
    blockApps,
    updateResolvConf,
    sendNotification,
} from './utils';

if (!isSudo()) {
    console.error('You must run this command with sudo.');
    process.exit(1);
}

updateResolvConf();

console.log('Starting daemon...');

setInterval(() => {
    const blockedApps = blockApps();

    for (const appName of blockedApps) {
        sendNotification('Ulysse', `Blocking ${appName}`);
    }
}, 1000);

import('./dns');
