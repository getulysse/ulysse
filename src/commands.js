import packageJson from '../package.json';
import { HELP } from './constants';
import {
    getParam,
    readConfig,
    enableShieldMode,
    disableShieldMode,
    isValidPassword,
    blockDistraction,
    unblockDistraction,
    whitelistDistraction,
} from './utils';

export const helpCmd = () => {
    console.log(HELP);
};

export const versionCmd = () => {
    console.log(packageJson.version);
};

export const daemonCmd = () => {
    import('./daemon');
};

export const blockCmd = (value) => {
    blockDistraction(value);
    console.log(`Blocking ${value}`);
};

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
        if (isValidPassword(password)) {
            disableShieldMode(password);
            console.log('Shield mode disabled.');
            return;
        }

        console.log('You must provide a valid password to disable the shield mode.');
    }
};

export const unblockCmd = (value) => {
    const config = readConfig();

    if (config?.shield) {
        console.log('You must disable the shield mode first.');
        return;
    }

    unblockDistraction(value);
    console.log(`Unblocking ${value}`);
};

export const whitelistCmd = (value) => {
    const config = readConfig();

    if (config?.shield) {
        console.log('You must disable the shield mode first.');
        return;
    }

    whitelistDistraction(value);
    console.log(`Whitelisting ${value}`);
};
