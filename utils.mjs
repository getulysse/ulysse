import fs from 'fs';
import uti from 'util';
import os from 'os';
import { exec } from 'child_process';

const DEFAULT_CONFIG_PATH = `${os.homedir()}/.config/ulysse/config.json`;

const params = process.argv.slice(2);

const configPath = params.includes('--config') ? params[params.indexOf('--config') + 1] : DEFAULT_CONFIG_PATH;
export const config = JSON.parse(await fs.readFileSync(configPath, 'utf8'));

export const blockHosts = async () => {
    const { blocklist } = config;

    fs.writeFileSync('/etc/hosts', blocklist.map((host) => `127.0.0.1 ${host} www.${host}`).join('\n'), 'utf8');
};

export const unBlockHosts = async () => {
    const lines = [
        '# Static table lookup for hostnames.',
        '# See hosts(5) for details.',
        '',
        '127.0.0.1 localhost',
        '::1 localhost ip6-localhost ip6-loopback',
    ].join('\n');

    fs.writeFileSync('/etc/hosts', lines, 'utf8');
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

export const checkDaemon = async () => {
    const execAsync = uti.promisify(exec);
    const { stdout } = await execAsync('pgrep -f "ulysse.*daemon|daemon.*ulysse"').catch(() => false);

    if (!stdout) {
        console.error('Daemon is not running');
        process.exit(1);
    }
};
