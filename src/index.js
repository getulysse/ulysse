#!/usr/bin/env node

import { version } from '../package.json';
import { HELP } from './constants';
import {
    readConfig,
    enableShieldMode,
    disableShieldMode,
    blockDistraction,
    unblockDistraction,
    isValidDistraction,
    whitelistDistraction,
} from './utils';

if (process.env.NODE_ENV === 'test') {
    console.log = () => {};
}

const getParam = (key) => {
    const index = process.argv.indexOf(key);
    return index !== -1 ? process.argv[index + 1] : null;
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

export const shieldCmd = (value) => {
    const password = getParam('--password') || getParam('-p');

    if (value === 'off') {
        disableShieldMode(password);
        console.log('Shield mode disabled.');
        return;
    }

    enableShieldMode();
    console.log('Shield mode enabled');
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

    if (command) {
        commands[command](value);
    } else {
        helpCmd();
    }
};

processCommand();
