#!/usr/bin/env node

import { getParam, getAlias, isDaemonRunning } from './utils';
import * as cmd from './commands';

const commands = {
    '--help': cmd.helpCmd,
    '--version': cmd.versionCmd,
    '--daemon': cmd.daemonCmd,
    '--block': cmd.blockCmd,
    '--unblock': cmd.unblockCmd,
    '--shield': cmd.shieldCmd,
    '--whitelist': cmd.whitelistCmd,
    '--server': cmd.serverCmd,
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

    cmd.helpCmd();
};

processCommand();
