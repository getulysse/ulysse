import fs from 'fs';
import net from 'net';
import crypto from 'crypto';
import readline from 'readline';
import { dirname } from 'path';
import { exec, execSync } from 'child_process';
import {
    CONFIG_PATH,
    RESOLV_CONF_PATH,
    DEFAULT_CONFIG,
    DNS_SERVER,
    SOCKET_PATH,
} from './constants';

const tryCatch = (fn, fallback = false, retry = 0) => (...args) => {
    try {
        return fn(...args);
    } catch (error) {
        if (retry <= 3) {
            return tryCatch(fn, fallback, retry + 1)(...args);
        }

        return fallback;
    }
};

export const createConfig = (config, path = CONFIG_PATH) => {
    fs.mkdirSync(dirname(path), { recursive: true });
    fs.writeFileSync(path, JSON.stringify(config, null, 4), 'utf8');
};

export const readConfig = (path = CONFIG_PATH) => {
    if (!fs.existsSync(path)) createConfig(DEFAULT_CONFIG, path);
    return JSON.parse(fs.readFileSync(path, 'utf8'));
};

export const sha256 = (str) => crypto.createHash('sha256').update(str).digest('hex');

export const isValidPassword = (password, path = CONFIG_PATH) => {
    if (!password) return false;
    const { passwordHash } = readConfig(path);
    const sha256sum = sha256(String(password));
    return sha256sum === passwordHash;
};

export const sendDataToSocket = (data) => {
    const client = net.createConnection(SOCKET_PATH);

    if (typeof data === 'object') {
        client.write(JSON.stringify(data));
    } else {
        client.write(data);
    }

    client.end();
};

export const blockRoot = () => {
    if (process.env.NODE_ENV === 'test') return;
    fs.writeFileSync('/etc/sudoers.d/ulysse', `${process.env.SUDO_USER} ALL=(ALL) !ALL`, 'utf8');
    fs.chmodSync('/etc/sudoers.d/ulysse', '0440');
};

export const unblockRoot = () => {
    if (fs.existsSync('/etc/sudoers.d/ulysse')) {
        fs.unlinkSync('/etc/sudoers.d/ulysse');
    }
};

export const editConfig = (config, path = CONFIG_PATH) => {
    const currentConfig = readConfig(path);
    const { blocklist = [], whitelist = [], password } = config;

    const newBlocklist = [...new Set([...currentConfig.blocklist, ...blocklist])];
    const newWhitelist = [...new Set([...currentConfig.whitelist, ...whitelist])];

    const newConfig = {
        ...currentConfig,
        blocklist: newBlocklist,
        whitelist: currentConfig.shield ? currentConfig.whitelist : newWhitelist,
    };

    if (!currentConfig.shield) {
        newConfig.blocklist = blocklist;
    }

    if (isValidPassword(password, path)) {
        unblockRoot();
        newConfig.shield = false;
        delete newConfig.passwordHash;
    }

    if (config.shield && password) {
        blockRoot();
        newConfig.shield = true;
        newConfig.passwordHash = sha256(password);
    }

    execSync(`chattr -i ${path}`);
    fs.writeFileSync(path, JSON.stringify(newConfig, null, 4), 'utf8');
    execSync(`chattr +i ${path}`);

    return newConfig;
};

export const getRunningApps = tryCatch(() => {
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
}, []);

export const isValidApp = (app) => {
    const paths = process.env.PATH.split(':');
    return paths.some((path) => fs.existsSync(`${path}/${app}`));
};

export const isValidDomain = (domain) => /^(\w+\.)+\w+$/.test(domain);

export const isValidDistraction = (distraction) => isValidDomain(distraction) || isValidApp(distraction);

export const blockDistraction = (distraction) => {
    const config = readConfig();
    config.blocklist.push(distraction);
    config.blocklist = [...new Set(config.blocklist)];
    sendDataToSocket(config);
};

export const unblockDistraction = (distraction) => {
    const config = readConfig();
    config.blocklist = config.blocklist.filter((d) => d !== distraction);
    sendDataToSocket(config);
};

export const whitelistDistraction = (distraction) => {
    const config = readConfig();
    config.whitelist.push(distraction);
    config.whitelist = [...new Set(config.whitelist)];
    sendDataToSocket(config);
};

export const isDomainBlocked = (domain, blocklist = [], whitelist = []) => {
    const isBlocked = blocklist.some((d) => domain.includes(d));
    const isWhitelisted = whitelist.some((d) => domain.includes(d));

    return isBlocked && !isWhitelisted;
};

export const isSudo = () => !!process.env.SUDO_USER;

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

    const apps = getRunningApps();

    const blockedApps = apps
        .filter((a) => blocklist?.includes(a.cmd) || blocklist?.includes(a.name))
        .map((p) => ({ ...p, name: blocklist.find((b) => b === p.cmd || b === p.name) }));

    if (!blockedApps.length) return [];

    for (const app of blockedApps) {
        exec(`kill -9 ${app.pid}`);
    }

    return [...new Set(blockedApps.map((p) => p.name))];
};

export const isDaemonRunning = () => {
    const apps = getRunningApps();

    const cmds = ['ulysse -d', 'ulysse --daemon'];

    return cmds.some((cmd) => apps.some((app) => app.cmd.includes(cmd)));
};

export const updateResolvConf = (dnsServer = DNS_SERVER) => {
    execSync(`chattr -i ${RESOLV_CONF_PATH}`);
    fs.writeFileSync(RESOLV_CONF_PATH, `nameserver ${dnsServer}`, 'utf8');
    execSync(`chattr +i ${RESOLV_CONF_PATH}`);
};

export const generatePassword = (length = 20) => {
    let password;

    const wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@%_+';
    const checkPassword = (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[@%_+]/.test(pwd);

    do {
        password = Array.from(crypto.randomBytes(length)).map((byte) => wishlist[byte % wishlist.length]).join('');
    } while (!checkPassword(password));

    return password;
};

export const enableShieldMode = () => {
    const config = readConfig();
    const password = generatePassword();
    const passwordHash = sha256(password);
    console.log(`Your password is: ${password}`);
    sendDataToSocket({ ...config, passwordHash, password, shield: true });
};

export const disableShieldMode = (password) => {
    const config = readConfig();
    sendDataToSocket({ ...config, password, shield: false });
};

export const displayPrompt = async (message) => {
    if (process.env.NODE_ENV === 'test') return true;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(message, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
};

export const getParam = (key) => {
    const index = process.argv.indexOf(key);
    return index !== -1 ? process.argv[index + 1] : undefined;
};

export const getAlias = (key) => key?.replace('--', '-').slice(0, 2);

export const isValidConfig = () => true;
