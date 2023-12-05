import fs from 'fs';
import os from 'os';
import uti from 'util';
import fetch from 'node-fetch';
import { exec } from 'child_process';
import { Service } from 'node-linux';
import { io } from 'socket.io-client';

const args = process.argv.slice(2);

export const config = (data = {}) => {
    const DEFAULT_CONFIG_PATH = `${process.env.SUDO_USER ? `/home/${process.env.SUDO_USER}` : os.homedir()}/.config/ulysse/config.json`;
    const configPath = args.includes('--config') ? args[args.indexOf('--config') + 1] : DEFAULT_CONFIG_PATH;

    if (!fs.existsSync(configPath)) return { profiles: [], configPath };

    const content = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    fs.writeFileSync(configPath, JSON.stringify({ ...content, ...data }, null, 4), 'utf8');

    content.profiles = content.profiles.map((p) => ({ ...p, hosts: p.hosts.flatMap((host) => [host, `www.${host}`]) }));

    return { ...content, configPath };
};

export const sleep = async (ms) => new Promise((r) => { setTimeout(r, ms); });

export const editResolvConfig = async (nameserver) => {
    const RESOLV_CONFIG_PATH = process.env.RESOLV_CONFIG_PATH || '/etc/resolv.conf';
    await exec(`chattr -i ${RESOLV_CONFIG_PATH}`);
    await sleep(1000);
    fs.writeFileSync(RESOLV_CONFIG_PATH, `nameserver ${nameserver}`, 'utf8');
    await exec(`chattr +i ${RESOLV_CONFIG_PATH}`);
};

export const blockDns = async () => {
    console.log('Block hosts...');
    await editResolvConfig('127.0.0.1');
};

export const unBlockDns = async () => {
    await editResolvConfig('9.9.9.9');
};

export const blockApps = async () => {
    const { currentProfile, profiles } = config();
    const { apps } = profiles.find((p) => p.name === currentProfile);

    if (!apps.length) return;

    console.log('Block apps...');

    for await (const app of apps) {
        await exec(`chmod -x /usr/bin/${app}`);
        await exec(`pkill -f -9 ${app}`);
    }
};

export const unBlockApps = async () => {
    const { currentProfile, profiles } = config();
    const { apps } = profiles.find((p) => p.name === currentProfile);

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
    const { currentProfile, configPath } = config();
    await checkRoot();

    const originalConsoleLog = console.log;
    console.log = () => {};

    const svc = new Service({
        name: 'ulysse',
        author: 'johackim',
        description: 'Ulysse',
        script: `${process.argv[1]} daemon --config ${configPath} -p ${currentProfile}`,
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

export const restartBrowser = async (browser) => {
    const execAsync = uti.promisify(exec);
    const { stdout } = await execAsync(`pgrep -f "${browser}"`).catch(() => false);

    if (!stdout) return;

    await exec(`pkill -TERM ${browser}`);
    await sleep(2000);
    await exec(`sudo -u ${process.env.SUDO_USER} ${browser}`);
};

export const restartBrowsers = async () => {
    const browsers = ['firefox', 'chromium', 'google-chrome'];

    for await (const browser of browsers) {
        await restartBrowser(browser);
    }
};

export const blockDevices = async () => {
    const currentProfile = args.find((arg) => arg === '-p') ? args[args.indexOf('-p') + 1] : 'default';
    const socket = io(config().server);
    await socket.emit('block', { params: { currentProfile } }, {});
};

export const sendWebhook = async (data, retry = 1) => {
    const { webhookUrl } = config();

    if (!webhookUrl || process.env.NODE_ENV === 'test') {
        return;
    }

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    if (retry >= 3) {
        return;
    }

    if (res.status !== 200) {
        await sendWebhook(data, retry + 1);
    }
};
