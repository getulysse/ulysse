import { isAbsolute } from 'path';
import { config } from './config';
import { getParam } from './utils';
import { version } from '../package.json';
import { HELP_MESSAGE } from './constants';
import { whitelistDistraction } from './whitelist';
import { isValidPassword, enableShieldMode, disableShieldMode } from './shield';
import { isValidDistraction, isValidDomain, blockDistraction, unblockDistraction } from './block';
import { daemon } from './daemon';

export const helpCmd = () => {
    console.log(HELP_MESSAGE);
};

export const versionCmd = () => {
    console.log(version);
};

export const daemonCmd = () => {
    daemon();
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

/* eslint-disable-next-line complexity */
export const whitelistCmd = (name) => {
    const time = getParam('--time') || getParam('-t');
    const password = getParam('--password') || getParam('-p');
    const distraction = { name, time };

    if (!isValidDomain(name.replace('*.', '')) && !isAbsolute(name)) {
        console.log('You must provide a valid distraction.');
        return;
    }

    if (isValidPassword(password)) {
        disableShieldMode(password);
        console.log('Shield mode disabled.');
        whitelistDistraction(distraction);
        console.log(`Whitelisting ${name}`);
        enableShieldMode(password);
        console.log('Shield mode enabled.');
        return;
    }

    if (config?.shield) {
        console.log('You must disable the shield mode first.');
        return;
    }

    if (!name) {
        console.log('You must provide a valid distraction.');
        return;
    }

    whitelistDistraction(distraction);
    console.log(`Whitelisting ${name}`);
};

/* eslint-disable-next-line complexity */
export const shieldCmd = (value = 'on') => {
    const password = getParam('--password') || getParam('-p');

    if (value === 'on') {
        if (config?.shield) {
            console.log('Shield mode already enabled.');
            return;
        }

        enableShieldMode(password);
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
