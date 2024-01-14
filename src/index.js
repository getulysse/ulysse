#!/usr/bin/env node

import { version } from '../package.json';
import {
    blockRoot,
    readConfig,
    checkDaemon,
    blockDistraction,
    unblockDistraction,
    whitelistDistraction,
} from './utils';

const config = readConfig();

const hasParam = (p) => p.some((param) => process.argv.includes(param));

const getParam = (p) => process.argv[process.argv.indexOf(p) + 1];

if (hasParam(['--help', '-h'])) {
    console.log('Usage: ulysse [options]');
    process.exit(0);
}

if (hasParam(['--version', '-v'])) {
    console.log(version);
    process.exit(0);
}

if (hasParam(['--list', '-l'])) {
    console.log('List of blocked devices');
    process.exit(0);
}

if (hasParam(['--daemon', '-d'])) {
    import('./daemon');
} else {
    checkDaemon();
}

if (hasParam(['--block', '-b'])) {
    const distraction = getParam('--block') || getParam('-b');
    blockDistraction(distraction);
    console.log(`Blocking ${distraction}`);
    process.exit(0);
}

if (hasParam(['--shield', '-s'])) {
    blockRoot();
    console.log('Shield mode enabled');
    process.exit(0);
}

if (!hasParam(['--daemon', '-d']) && config.shield) {
    console.log('You must disable shield mode to unblock a distraction.');
    process.exit(1);
}

if (hasParam(['--unblock', '-u'])) {
    const distraction = getParam('--unblock') || getParam('-u');
    unblockDistraction(distraction);
    console.log(`Unblocking ${distraction}`);
    process.exit(0);
}

if (hasParam(['--clear', '-c'])) {
    console.log('Clearing blocked devices');
    process.exit(0);
}

if (hasParam(['--whitelist', '-w'])) {
    const distraction = getParam('--whitelist') || getParam('-w');
    whitelistDistraction(distraction);
    console.log(`Whitelisting ${distraction}`);
    process.exit(0);
}
