import fs from 'fs';
import { execSync } from 'child_process';
import { dns } from './dns';
import { socket } from './socket';
import { getBlockedApps } from './block';
import { config, editConfig } from './config';
import { isSudo, sendNotification, getRunningApps, removeDuplicates } from './utils';
import { isDistractionWhitelisted } from './whitelist';
import { listActiveWindows, closeWindow } from './x11';
import { SOCKET_PATH, DNS_SERVER, RESOLV_CONF_PATH } from './constants';

export const updateResolvConf = (dnsServer = DNS_SERVER) => {
    execSync(`chattr -i ${RESOLV_CONF_PATH}`);
    fs.writeFileSync(RESOLV_CONF_PATH, `nameserver ${dnsServer}`, 'utf8');
    execSync(`chattr +i ${RESOLV_CONF_PATH}`);
};

export const handleAppBlocking = async () => {
    const activeWindows = await listActiveWindows();
    const runningApps = getRunningApps();
    const blockedApps = getBlockedApps();

    const windowsToClose = blockedApps.includes('*')
        ? activeWindows.filter((app) => !isDistractionWhitelisted(app.name))
        : activeWindows.filter((app) => blockedApps.includes(app.name));

    const processesToKill = blockedApps.includes('*')
        ? runningApps.filter((app) => !isDistractionWhitelisted(app.name))
        : runningApps.filter((app) => blockedApps.includes(app.name));

    const apps = removeDuplicates([...windowsToClose, ...processesToKill]);

    for (const app of apps) {
        try {
            if (app.windowId) closeWindow(app.windowId); // eslint-disable-line max-depth
            execSync(`kill -9 ${app.pid} > /dev/null 2>&1`);
            console.log(`Blocking ${app.name}`);
            sendNotification('Ulysse', `Blocking ${app.name}`);
        } catch (e) {
            console.error(e);
        }
    }
};

export const handleTimeout = async () => {
    const blocklist = config.blocklist.filter(({ timeout }) => !timeout || timeout >= Math.floor(Date.now() / 1000));
    const whitelist = config.whitelist.filter(({ timeout }) => !timeout || timeout >= Math.floor(Date.now() / 1000));

    if (blocklist.length !== config.blocklist.length) {
        await editConfig(config);
    }

    if (whitelist.length !== config.whitelist.length) {
        await editConfig(config);
    }

    if (config.shield.timeout <= Math.floor(Date.now() / 1000)) {
        console.log('Shield mode timeout reached, disabling shield mode.');
        await editConfig({ ...config, shield: { enable: false } });
    }
};

export const cleanUpAndExit = () => {
    updateResolvConf();
    fs.unlinkSync(SOCKET_PATH);
    process.exit(0);
};

export const daemon = async () => {
    if (!isSudo()) {
        console.error('You must run this command with sudo.');
        process.exit(1);
    }

    setInterval(async () => {
        await handleAppBlocking();
    }, 1000);

    setInterval(() => {
        handleTimeout();
    }, 1000);

    console.log('Starting daemon...');
    updateResolvConf('127.0.0.1');

    process.on('SIGINT', cleanUpAndExit);
    process.on('SIGTERM', cleanUpAndExit);

    socket();
    dns();
};
