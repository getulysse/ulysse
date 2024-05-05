import fs from 'fs';
import { execSync } from 'child_process';
import { config, editConfig } from './config';
import { getRunningBlockedApps } from './block';
import { isSudo, sendNotification } from './utils';
import { DNS_SERVER, RESOLV_CONF_PATH } from './constants';
import { synchronize } from './synchronize';
import { socket } from './socket';
import { dns } from './dns';

export const updateResolvConf = (dnsServer = DNS_SERVER) => {
    execSync(`chattr -i ${RESOLV_CONF_PATH}`);
    fs.writeFileSync(RESOLV_CONF_PATH, `nameserver ${dnsServer}`, 'utf8');
    execSync(`chattr +i ${RESOLV_CONF_PATH}`);
};

export const handleAppBlocking = () => {
    const runningBlockedApps = getRunningBlockedApps();

    for (const app of runningBlockedApps) {
        try {
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

    if (blocklist.length !== config.blocklist.length || whitelist.length !== config.whitelist.length) {
        await editConfig({ ...config, blocklist, whitelist });
    }
};

export const cleanUpAndExit = () => {
    updateResolvConf();
    process.exit(0);
};

export const daemon = () => {
    if (!isSudo()) {
        console.error('You must run this command with sudo.');
        process.exit(1);
    }

    setInterval(() => {
        handleAppBlocking();
    }, 1000);

    setInterval(() => {
        handleTimeout();
    }, 60000);

    console.log('Starting daemon...');
    updateResolvConf('127.0.0.1');

    process.on('SIGINT', cleanUpAndExit);
    process.on('SIGTERM', cleanUpAndExit);

    synchronize();
    socket();
    dns();
};
