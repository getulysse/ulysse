import fs from 'fs';
import { exec } from 'child_process';
import { DEFAULT_CONFIG_PATH } from './constants';
import {
    isSudo,
    blockApps,
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

updateResolvConf();

console.log('Starting daemon...');

const blockRoot = () => {
    exec(`chattr +i ${DEFAULT_CONFIG_PATH}`);
    fs.writeFileSync('/etc/sudoers.d/ulysse', `${process.env.SUDO_USER} ALL=(ALL) !ALL`, 'utf8');
    fs.chmodSync('/etc/sudoers.d/ulysse', '0440');
};

const unblockRoot = () => {
    const { passwordHash, ...config } = readConfig();

    exec(`chattr -i ${DEFAULT_CONFIG_PATH}`).on('close', () => {
        editConfig({ ...config, shield: false });
    });

    fs.unlinkSync('/etc/sudoers.d/ulysse');
};

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

process.on('SIGINT', () => {
    unblockRoot();
    process.exit(0);
});

process.on('SIGTERM', () => {
    unblockRoot();
    process.exit(0);
});

import('./dns');
