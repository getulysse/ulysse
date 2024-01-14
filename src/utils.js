import fs from 'fs';
import dns from 'dns';
import uti from 'util';
import { dirname } from 'path';
import { exec } from 'child_process';
import { DEFAULT_CONFIG_PATH, DEFAULT_CONFIG, PIPE_PATH } from './constants';

export const readConfig = (path = DEFAULT_CONFIG_PATH) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(dirname(path), { recursive: true });
        fs.writeFileSync(path, JSON.stringify(DEFAULT_CONFIG, null, 4), 'utf8');
    }

    const config = JSON.parse(fs.readFileSync(path, 'utf8'));

    return config;
};

export const editConfig = (config, path = DEFAULT_CONFIG_PATH) => {
    fs.writeFileSync(path, JSON.stringify(config, null, 4), 'utf8');
};

export const execSync = async (command) => {
    const execAsync = uti.promisify(exec);
    const { stdout } = await execAsync(command).catch(() => false);

    return stdout;
};

export const getDomainIp = (domain) => new Promise((resolve) => {
    dns.lookup(domain, { family: 4 }, (error, ip) => {
        if (error) resolve(false);
        resolve(ip);
    });
});

const tryCatch = (fn) => (...args) => {
    try {
        return fn(...args);
    } catch (error) {
        return false;
    }
};

export const getApps = tryCatch(() => {
    const folders = fs.readdirSync('/proc').filter((f) => !Number.isNaN(Number(f)));

    let apps = folders.map((folder) => {
        if (!fs.existsSync(`/proc/${folder}/status`) || !fs.existsSync(`/proc/${folder}/cmdline`)) return false;

        const status = fs.readFileSync(`/proc/${folder}/status`, 'utf8');
        const name = status.split('\n')[0].split(':').pop().trim();
        const cmd = fs.readFileSync(`/proc/${folder}/cmdline`, 'utf8').split('\u0000').join(' ').trim();

        return { pid: folder, cmd, name };
    });

    apps = apps.filter((p) => p.name);

    return apps;
});

export const blockDistraction = (distraction) => {
    const config = readConfig();
    config.blocklist.push(distraction);
    config.blocklist = [...new Set(config.blocklist)];
    editConfig(config, PIPE_PATH);
};

export const unblockDistraction = (distraction) => {
    const config = readConfig();
    config.blocklist = config.blocklist.filter((d) => d !== distraction);
    editConfig(config, PIPE_PATH);
};

export const whitelistDistraction = (distraction) => {
    const config = readConfig();
    config.whitelist.push(distraction);
    config.whitelist = [...new Set(config.whitelist)];
    editConfig(config, PIPE_PATH);
};

export const isDomainBlocked = (domain, blocklist = [], whitelist = []) => {
    const isBlocked = blocklist.some((d) => domain.includes(d));
    const isWhitelisted = whitelist.some((d) => domain.includes(d));

    return isBlocked && !isWhitelisted;
};

export const checkSudo = () => {
    if (process.env.NODE_ENV === 'test') return;

    if (!process.env.SUDO_USER) {
        console.error('You must run this command with sudo.');
        process.exit(1);
    }
};

export const sendNotification = (title, message) => {
    const envs = [
        'DISPLAY=:0',
        'XAUTHORITY=/home/$SUDO_USER/.Xauthority',
        'DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/$SUDO_UID/bus',
    ].join(' ');

    exec(`sudo -u $SUDO_USER ${envs} notify-send "${title}" "${message}"`);
};

export const blockApps = () => {
    const { blocklist } = readConfig();

    const apps = getApps() || [];

    const blockedApps = apps.filter((p) => blocklist?.includes(p.cmd) || blocklist?.includes(p.name));

    if (!blockedApps.length) return [];

    for (const app of blockedApps) {
        exec(`kill -9 ${app.pid}`);
    }

    return [...new Set(blockedApps.map((p) => p.name))];
};

export const blockRoot = () => {
    exec('chattr +i /etc/resolv.conf');
    exec(`chattr +i ${DEFAULT_CONFIG_PATH}`);
    const config = readConfig();
    editConfig({ ...config, shield: true });
};

export const unblockRoot = () => {
    exec('sudo chattr -i /etc/resolv.conf');
    exec(`sudo chattr -i ${DEFAULT_CONFIG_PATH}`);
};

export const checkDaemon = () => {
    if (process.env.NODE_ENV === 'test') return;

    const apps = getApps();

    const cmds = [
        'sudo npm run start -- --daemon',
        'sudo npx babel-node src/daemon.js',
        'sudo npx babel-node src/index.js --daemon',
    ];

    const isDaemonRunning = apps.some((p) => cmds.includes(p.cmd));

    if (!isDaemonRunning) {
        console.error('You must run the daemon first.');
        process.exit(1);
    }
};

/* const isWritable = (path) => {
    try {
        fs.accessSync(path, fs.constants.W_OK);
        return true;
    } catch (error) {
        return false;
    }
}; */
