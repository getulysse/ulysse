import {
    checkSudo,
    blockApps,
    updateResolvConf,
    sendNotification,
} from './utils';

checkSudo();
updateResolvConf();

console.log('Starting daemon...');

setInterval(() => {
    const blockedApps = blockApps();

    for (const appName of blockedApps) {
        sendNotification('Ulysse', `Blocking ${appName}`);
    }
}, 1000);

import('./dns');
