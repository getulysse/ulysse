#!/usr/bin/env node

import { program } from 'commander';
import { prompt } from 'enquirer';
import { config } from './config';
import { daemon } from './daemon';
import { version } from '../package.json';
import { DEFAULT_TIMEOUT } from './constants';
import { isDaemonRunning, isValidTimeout, getPasswordFromPrompt } from './utils';
import { clearBlocklist, blockDistraction, unblockDistraction } from './block';
import { clearWhitelist, whitelistDistraction, unwhitelistDistraction } from './whitelist';
import { enableShieldMode, disableShieldMode, isValidPassword } from './shield';

program
    .name('ulysse')
    .description('A simple CLI tool for blocking your distracting apps and websites.')
    .version(version, '-v, --version', 'Show the version and exit')
    .helpOption('-h, --help', 'Show this help message and exit');

const daemonCmd = program
    .command('daemon')
    .description('Start the Ulysse daemon');

daemonCmd
    .command('start')
    .description('Start the Ulysse daemon')
    .action(async () => {
        await daemon();
        console.log('Ulysse daemon started.');
    });

const blocklistCmd = program
    .command('blocklist')
    .description('Manage the blocklist');

blocklistCmd
    .command('add')
    .description('Add an app or website to the blocklist')
    .argument('<name>', 'Name of the app or website to block')
    .option('-w, --website', 'Block a website')
    .option('-a, --app', 'Block an app')
    .option('-t, --time <time>', 'Time interval for blocking (e.g., 8h-20h)')
    .action(async (name, { website, app, time }) => {
        if (!website && !app) {
            console.log('You must specify whether it is a website or an app.');
            return;
        }

        const type = app ? 'app' : 'website';

        await blockDistraction({ name, type, time });

        console.log(`Blocking ${type} ${name}${time ? ` during ${time}` : ''}`);
    });

blocklistCmd
    .command('rm')
    .description('Remove an app or website from the blocklist')
    .argument('<name>', 'Name of the app or website to unblock')
    .option('-w, --website', 'Unblock a website')
    .option('-a, --app', 'Unblock an app')
    .action(async (name, { website, app }) => {
        if (config.shield.enable) {
            console.log('You must disable the shield mode first.');
            return;
        }

        if (!website && !app) {
            console.log('You must specify whether it is a website or an app.');
            return;
        }

        const type = app ? 'app' : 'website';

        await unblockDistraction({ name, type });

        console.log(`Unblocking ${type} ${name}`);
    });

blocklistCmd
    .command('clear')
    .description('Clear the blocklist')
    .action(async () => {
        if (config.shield.enable) {
            console.log('You must disable the shield mode first.');
            return;
        }

        await clearBlocklist();
        console.log('Blocklist cleared.');
    });

blocklistCmd
    .command('list')
    .alias('l')
    .description('List all blocked items')
    .action(() => {
        const { blocklist } = config;

        if (blocklist.length === 0) {
            console.log('No blocked items found.');
            return;
        }

        console.log('Blocked items:');

        blocklist.forEach((item, index) => {
            const timeInfo = item.time ? ` (time: ${item.time})` : '';
            const typeInfo = item.type ? ` [${item.type}]` : '';
            console.log(`  ${index + 1}. ${item.name}${typeInfo}${timeInfo}`);
        });
    });

const whitelistCmd = program
    .command('whitelist')
    .description('Manage the whitelist');

whitelistCmd
    .command('add')
    .description('Add an app or website to the whitelist')
    .argument('<name>', 'Name of the app or website to whitelist')
    .option('-w, --website', 'Whitelist a website')
    .option('-a, --app', 'Whitelist an app')
    .action(async (name, { website, app }) => {
        if (!website && !app) {
            console.log('You must specify whether it is a website or an app.');
            return;
        }

        if (config.shield.enable) {
            console.log('You must disable the shield mode first.');
            return;
        }

        const type = app ? 'app' : 'website';

        await whitelistDistraction({ name, type });

        console.log(`Whitelisting ${type} ${name}`);
    });

whitelistCmd
    .command('rm')
    .description('Remove an app or website from the whitelist')
    .argument('<name>', 'Name of the app or website to remove from whitelist')
    .option('-w, --website', 'Remove a website from the whitelist')
    .option('-a, --app', 'Remove an app from the whitelist')
    .action(async (name, { website, app }) => {
        if (config.shield.enable) {
            console.log('You must disable the shield mode first.');
            return;
        }

        if (!website && !app) {
            console.log('You must specify whether it is a website or an app.');
            return;
        }

        const type = app ? 'app' : 'website';

        await unwhitelistDistraction({ name, type });

        console.log(`Remove ${type} ${name} from whitelist`);
    });

whitelistCmd
    .command('clear')
    .description('Clear the whitelist')
    .action(async () => {
        if (config.shield.enable) {
            console.log('You must disable the shield mode first.');
            return;
        }

        await clearWhitelist();
        console.log('Whitelist cleared.');
    });

whitelistCmd
    .command('list')
    .alias('l')
    .description('List all whitelisted items')
    .action(() => {
        const { whitelist } = config;

        if (whitelist.length === 0) {
            console.log('No whitelisted items found.');
            return;
        }

        console.log('Whitelisted items:');

        whitelist.forEach((item, index) => {
            const timeInfo = item.time ? ` (time: ${item.time})` : '';
            const typeInfo = item.type ? ` [${item.type}]` : '';
            console.log(`  ${index + 1}. ${item.name}${typeInfo}${timeInfo}`);
        });
    });

const shieldCmd = program
    .command('shield')
    .description('Enable or disable the shield mode');

shieldCmd
    .command('enable')
    .description('Enable the shield mode')
    .option('-p, --password <password>', 'Password to disable shield mode')
    .option('-t, --timeout <timeout>', 'Timeout for shield mode (e.g., 30m, 1h, 2d)')
    .action(async ({ password = null, timeout = DEFAULT_TIMEOUT }) => {
        if (config.shield.enable) {
            console.log('Shield mode is already enabled.');
            return;
        }

        if (!isValidTimeout(timeout)) {
            console.error('Invalid timeout format. Use "30m", "1h", "2d", etc.');
            return;
        }

        const { confirm } = await prompt({
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to enable shield mode for ${timeout}?`,
            format: () => '',
            separator: () => '',
            symbols: { prefix: '' },
        });

        if (!confirm) return;

        await enableShieldMode(password, timeout);
        console.log(`Shield mode enabled for ${timeout}.`);
    });

shieldCmd
    .command('disable')
    .description('Disable the shield mode')
    .option('-p, --password <password>', 'Password to disable shield mode')
    .action(async (options) => {
        if (!config.shield.enable) {
            console.log('Shield mode is already disabled.');
            return;
        }

        const password = options.password || await getPasswordFromPrompt();

        if (!isValidPassword(password)) {
            console.log('Invalid password');
            return;
        }

        await disableShieldMode(password);
        console.log('Shield mode disabled.');
    });

shieldCmd
    .command('status')
    .description('Show the shield mode status')
    .action(() => {
        const { shield } = config;

        if (!shield.enable) {
            console.log('Shield mode is disabled');
            return;
        }

        if (shield.timeout) {
            const now = Math.floor(Date.now() / 1000);
            const minutes = Math.max(0, Math.floor((shield.timeout - now) / 60));
            const seconds = Math.max(0, (shield.timeout - now) % 60);

            console.log(`Shield mode is enabled (${minutes}m${seconds}s remaining)`);
        } else {
            console.log('Shield mode is enabled');
        }
    });

program.addHelpText('after', `
Examples:
  ulysse daemon start
  ulysse blocklist add --app firefox
  ulysse whitelist add --website wikipedia.org
  ulysse blocklist add --website youtube.com -t 8h-20h
  ulysse shield enable`);

program.commands.forEach((cmd) => {
    if (cmd.name() !== 'daemon') {
        cmd.hook('preAction', () => {
            if (!isDaemonRunning()) {
                console.error('You must start the daemon first with "ulysse daemon start".');
                process.exit(1);
            }
        });
    }
});

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}
