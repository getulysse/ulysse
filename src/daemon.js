import fs from 'fs';
import { execSync } from 'child_process';
import { config, editConfig } from './config';
import { getRunningBlockedApps } from './block';
import { isSudo, sendNotification } from './utils';
import { DNS_SERVER, RESOLV_CONF_PATH } from './constants';

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

export const handleTimeout = () => {
    config.blocklist = config.blocklist.filter(({ timeout }) => !timeout || timeout >= Math.floor(Date.now() / 1000));
    config.whitelist = config.whitelist.filter(({ timeout }) => !timeout || timeout >= Math.floor(Date.now() / 1000));

    editConfig(config);
};

export const cleanUpAndExit = () => {
    updateResolvConf();
    process.exit(0);
};

if (!isSudo()) {
    console.error('You must run this command with sudo.');
    process.exit(1);
}

if (process.env.NODE_ENV !== 'test') {
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
    import('./dns');
}
