import { version } from '../package.json';
import { HELP_MESSAGE } from './constants';
import {
    getParam,
    readConfig,
    enableShieldMode,
    disableShieldMode,
    isValidPassword,
    blockDistraction,
    isValidDistraction,
    unblockDistraction,
    whitelistDistraction,
} from './utils';

export const helpCmd = () => {
    console.log(HELP_MESSAGE);
};

export const versionCmd = () => {
    console.log(version);
};

export const daemonCmd = () => {
    import('./daemon');
};

export const serverCmd = () => {
    import('./server');
};

export const blockCmd = (name) => {
    const time = getParam('--time') || getParam('-t');
    const distraction = { name, time };

    if (!isValidDistraction(distraction)) {
        console.log('You must provide a valid distraction.');
        return;
    }

    blockDistraction(distraction);
    console.log(`Blocking ${name}`);
};

export const unblockCmd = (name) => {
    const time = getParam('--time') || getParam('-t');
    const distraction = { name, time };
    const config = readConfig();

    if (!isValidDistraction(distraction)) {
        console.log('You must provide a valid distraction.');
        return;
    }

    if (config?.shield) {
        console.log('You must disable the shield mode first.');
        return;
    }

    unblockDistraction(distraction);
    console.log(`Unblocking ${name}`);
};

export const whitelistCmd = (name) => {
    const config = readConfig();

    if (config?.shield) {
        console.log('You must disable the shield mode first.');
        return;
    }

    whitelistDistraction({ name });
    console.log(`Whitelisting ${name}`);
};

/* eslint-disable-next-line complexity */
export const shieldCmd = (value = 'on') => {
    const config = readConfig();
    const password = getParam('--password') || getParam('-p');

    if (value === 'on') {
        if (config?.shield) {
            console.log('Shield mode already enabled.');
            return;
        }

        enableShieldMode();
        console.log('Shield mode enabled.');
    }

    if (value === 'off') {
        if (!config?.shield) {
            console.log('Shield mode already disabled.');
            return;
        }

        if (isValidPassword(password)) {
            disableShieldMode(password);
            console.log('Shield mode disabled.');
            return;
        }

        console.log('You must provide a valid password to disable the shield mode.');
    }
};
