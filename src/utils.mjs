import fs from 'fs';
import os from 'os';
import uti from 'util';
import { exec } from 'child_process';
import { Service } from 'node-linux';

const DEFAULT_CONFIG_PATH = `${process.env.SUDO_USER ? `/home/${process.env.SUDO_USER}` : os.homedir()}/.config/ulysse/config.json`;

const HOSTS_CONFIG_PATH = process.env.HOSTS_CONFIG_PATH || '/etc/hosts';

const params = process.argv.slice(2);

const configPath = params.includes('--config') ? params[params.indexOf('--config') + 1] : DEFAULT_CONFIG_PATH;

export const config = JSON.parse(await fs.readFileSync(configPath, 'utf8'));

export const sleep = async (ms) => new Promise((r) => { setTimeout(r, ms); });

export const blockHosts = async () => {
    const { blocklist } = config;

    if (!blocklist.length) return;

    console.log('Block hosts...');

    fs.writeFileSync(HOSTS_CONFIG_PATH, blocklist.map((host) => `127.0.0.1 ${host} www.${host}`).join('\n'), 'utf8');
};

export const unBlockHosts = async () => {
    const lines = [
        '# Static table lookup for hostnames.',
        '# See hosts(5) for details.',
        '',
        '127.0.0.1 localhost',
        '::1 localhost ip6-localhost ip6-loopback',
    ].join('\n');

    fs.writeFileSync(HOSTS_CONFIG_PATH, lines, 'utf8');
};

export const blockApps = async () => {
    const { apps } = config;

    if (!apps.length) return;

    console.log('Block apps...');

    for await (const app of apps) {
        await exec(`chmod -x /usr/bin/${app}`);
        await exec(`pkill -f -9 ${app}`);
    }
};

export const unBlockApps = async () => {
    const { apps } = config;

    for await (const app of apps) {
        await exec(`chmod +x /usr/bin/${app}`);
    }
};

export const blockRoot = async () => {
    console.log('Block root...');
    await exec('chmod -x /usr/bin/sudo');
    await exec('chmod -x /usr/bin/su');
    await exec('chmod -x /usr/bin/sudoedit');
    await exec('chmod -x /usr/bin/suexec');
};

export const unBlockRoot = async () => {
    await exec('chmod +x /usr/bin/sudo');
    await exec('chmod +x /usr/bin/su');
    await exec('chmod +x /usr/bin/sudoedit');
    await exec('chmod +x /usr/bin/suexec');
};

export const checkRoot = async () => {
    const execAsync = uti.promisify(exec);
    const { stdout } = await execAsync('whoami').catch(() => false);

    if (stdout.trim() !== 'root') {
        console.error('You must be root to run this command');
        process.exit(1);
    }
};

export const installDaemon = async () => {
    await checkRoot();

    const originalConsoleLog = console.log;
    console.log = () => {};

    const svc = new Service({
        name: 'ulysse',
        description: 'Ulysse',
        script: `./src/daemon.mjs --config ${configPath}`,
    });

    if (!svc.exists()) {
        originalConsoleLog('Install daemon...');
        await svc.install();
        await sleep(1000);
    }

    await svc.start();

    console.log = originalConsoleLog;
};

export const checkDaemon = async () => {
    const execAsync = uti.promisify(exec);
    const { stdout } = await execAsync('pgrep -f "ulysse.*daemon|daemon.*ulysse"').catch(() => false);

    if (!stdout) {
        console.error('Daemon is not running');
        process.exit(1);
    }
};
