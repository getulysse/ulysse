import fs from 'fs';
import { exec } from 'child_process';
import { DEFAULT_CONFIG_PATH } from './constants';
import {
    isSudo,
    blockApps,
    blockRoot,
    unblockRoot,
    editConfig,
    readConfig,
    isFileWritable,
    isValidPassword,
    updateResolvConf,
    sendNotification,
} from './utils';

if (!isSudo()) {
    console.error('You must run this command with sudo.');
    process.exit(1);
}

updateResolvConf('127.0.0.1');

console.log('Starting daemon...');

const handleAppBlocking = () => {
    const blockedApps = blockApps();

    for (const appName of blockedApps) {
        sendNotification('Ulysse', `Blocking ${appName}`);
    }
};

const handleNewDistractions = () => {
    const config = readConfig();
    const { blocklist } = readConfig(`${DEFAULT_CONFIG_PATH}.tmp`);

    if (!blocklist?.length) return;

    console.log('Blocking new distractions...');
    exec(`chattr -i ${DEFAULT_CONFIG_PATH}`).on('close', () => {
        const newBlocklist = [...new Set([...config.blocklist, ...blocklist])];
        editConfig({ ...config, blocklist: newBlocklist });
        fs.unlinkSync(`${DEFAULT_CONFIG_PATH}.tmp`);
        blockRoot();
    });
};

const handleRootBlocking = () => {
    const config = readConfig();

    if (config.shield && isFileWritable(DEFAULT_CONFIG_PATH)) {
        blockRoot();
        console.log('Shield mode enabled.');
    }

    const { password } = readConfig(`${DEFAULT_CONFIG_PATH}.tmp`);

    if (isValidPassword(password)) {
        unblockRoot();
        fs.unlinkSync(`${DEFAULT_CONFIG_PATH}.tmp`);
        console.log('Shield mode disabled.');
    }
};

setInterval(async () => {
    await handleAppBlocking();
    await handleRootBlocking();
    await handleNewDistractions();
}, 1000);

process.on('SIGINT', async () => {
    await unblockRoot();
    await updateResolvConf();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    await unblockRoot();
    await updateResolvConf();
    process.exit(0);
});

import('./dns');
