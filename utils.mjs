import fs from 'fs';
import uti from 'util';
import os from 'os';
import { exec } from 'child_process';

const DEFAULT_CONFIG_PATH = `${os.homedir()}/.config/ulysse/config.json`;

const params = process.argv.slice(2);

const configPath = params.includes('--config') ? params[params.indexOf('--config') + 1] : DEFAULT_CONFIG_PATH;
export const config = JSON.parse(await fs.readFileSync(configPath, 'utf8'));

export const blockHosts = async () => {
    const { whitelist } = config;

    const lines = [
        'domain-needed',
        'bogus-priv',
        'no-resolv',
        'server=9.9.9.9',
        'server=/toggl.com/#',
        'server=/api.track.toggl.com/#',
        'address=/#/0.0.0.0',
        'address=/#/::',
        '',
    ].join('\n');

    fs.writeFileSync('/etc/dnsmasq.conf', lines, 'utf8');
    fs.appendFileSync('/etc/dnsmasq.conf', whitelist.map((host) => `server=/${host}/#`).join('\n'), 'utf8');

    await exec('systemctl restart dnsmasq');
};

export const unBlockHosts = async () => {
    const lines = [
        'domain-needed',
        'bogus-priv',
        'no-resolv',
        'server=9.9.9.9',
    ].join('\n');

    fs.writeFileSync('/etc/dnsmasq.conf', lines, 'utf8');

    await exec('systemctl restart dnsmasq');
};

export const blockApps = async () => {
    const { apps } = config;

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

export const clearBrowser = async () => {
    await exec('pkill -TERM chromium');
    await exec('rm -rf ~/.config/chromium/Default/History');
    await exec('rm -rf ~/.config/chromium/Default/Local Storage');
    await exec('rm -rf ~/.cache/chromium');
    await exec('chromium');
};

export const checkDaemon = async () => {
    const execAsync = uti.promisify(exec);
    const { stdout } = await execAsync('pgrep -f "ulysse.*daemon|daemon.*ulysse"').catch(() => false);

    if (!stdout) {
        console.error('Daemon is not running');
        process.exit(1);
    }
};

export const sleep = async (ms) => new Promise((r) => { setTimeout(r, ms); });
