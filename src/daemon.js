import fs from 'fs';
import { exec } from 'child_process';
import { PIPE_PATH, DEFAULT_CONFIG_PATH } from './constants';
import {
    readConfig,
    editConfig,
    blockRoot,
    checkSudo,
    blockApps,
    sendNotification,
} from './utils';

checkSudo();

console.log('Starting daemon...');

setInterval(() => {
    const blockedApps = blockApps();

    for (const appName of blockedApps) {
        sendNotification('Ulysse', `Blocking ${appName}`);
    }

    if (!fs.existsSync(PIPE_PATH)) return;

    const config = readConfig();
    const { blocklist, whitelist } = readConfig(PIPE_PATH);

    exec(`sudo chattr -i ${DEFAULT_CONFIG_PATH}`).on('close', () => {
        config.blocklist = [...new Set([...config.blocklist, ...blocklist])];
        if (!config.shield) {
            config.whitelist = [...new Set([...config.whitelist, ...whitelist])];
        }
        editConfig(config);
        if (config.shield) {
            blockRoot();
        }
        fs.unlinkSync(PIPE_PATH);
    });
}, 1000);

import('./dns');
