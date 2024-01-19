#!/usr/bin/env node

import { version } from '../package.json';
import { HELP } from './constants';
import {
    readConfig,
    enableShieldMode,
    disableShieldMode,
    blockDistraction,
    unblockDistraction,
    isDaemonRunning,
    isValidDistraction,
    isValidPassword,
    whitelistDistraction,
} from './utils';

if (process.env.NODE_ENV === 'test') {
    console.log = () => {};
}

const getParam = (key) => {
    const index = process.argv.indexOf(key);
    return index !== -1 ? process.argv[index + 1] : undefined;
};

export const helpCmd = () => {
    console.log(HELP);
};

export const versionCmd = () => {
    console.log(version);
};

export const daemonCmd = async () => {
    await import('./daemon');
};

export const blockCmd = (value) => {
    if (!isValidDistraction(value)) {
        console.log('You must provide a valid value to block.');
        return;
    }

    blockDistraction(value);
    console.log(`Blocking ${value}`);
};

export const shieldCmd = (value = 'on') => {
    const config = readConfig();
    const password = getParam('--password') || getParam('-p');

    if (value === 'on' && config.shield) {
        console.log('Shield mode is already enabled.');
        return;
    }

    if (value === 'on') {
        enableShieldMode();
        console.log('Shield mode enabled.');
        return;
    }

    if (!isValidPassword(password)) {
        console.log('You must provide a valid password to disable the shield mode.');
        return;
    }

    disableShieldMode(password);
    console.log('Shield mode disabled.');
};

export const unblockCmd = (value) => {
    const config = readConfig();

    if (!isValidDistraction(value)) {
        console.log('You must provide a value to unblock.');
        return;
    }

    if (config.shield) {
        console.log('You must disable the shield mode first.');
        return;
    }

    unblockDistraction(value);
    console.log(`Unblocking ${value}`);
};

export const whitelistCmd = (value) => {
    const config = readConfig();

    if (!isValidDistraction(value)) {
        console.log('You must provide a value to whitelist.');
        return;
    }

    if (config.shield) {
        console.log('You must disable the shield mode first.');
        return;
    }

    whitelistDistraction(value);
    console.log(`Whitelisting ${value}`);
};

const commands = {
    '--help': helpCmd,
    '--version': versionCmd,
    '--daemon': daemonCmd,
    '--block': blockCmd,
    '--unblock': unblockCmd,
    '--shield': shieldCmd,
    '--whitelist': whitelistCmd,
};

const getAlias = (key) => key?.replace('--', '-').slice(0, 2);

const processCommand = () => {
    const command = Object.keys(commands).find((c) => process.argv.includes(c) || process.argv.includes(getAlias(c)));
    const alias = getAlias(command);
    const value = getParam(command) || getParam(alias);

    if (!['--help', '--version', '--daemon', undefined].includes(command) && !isDaemonRunning()) {
        console.log('You must start the daemon first.');
        return;
    }

    if (command) {
        commands[command](value);
    } else {
        helpCmd();
    }
};

processCommand();
