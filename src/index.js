#!/usr/bin/env node

import { getParam, getAlias, isDaemonRunning } from './utils';
import {
    helpCmd,
    versionCmd,
    daemonCmd,
    blockCmd,
    shieldCmd,
    serverCmd,
    unblockCmd,
    whitelistCmd,
} from './commands';

const commands = {
    '--help': helpCmd,
    '--version': versionCmd,
    '--daemon': daemonCmd,
    '--block': blockCmd,
    '--unblock': unblockCmd,
    '--shield': shieldCmd,
    '--whitelist': whitelistCmd,
    '--server': serverCmd,
};

const processCommand = () => {
    const command = Object.keys(commands).find((c) => process.argv.includes(c) || process.argv.includes(getAlias(c)));
    const alias = getAlias(command);
    const value = getParam(command) || getParam(alias);

    if (!['--help', '--version', '--daemon', '--server', undefined].includes(command) && !isDaemonRunning()) {
        console.log('You must start the daemon first.');
        return;
    }

    if (command) {
        commands[command](value);
        return;
    }

    helpCmd();
};

processCommand();
