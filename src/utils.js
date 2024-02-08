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

export const isValidApp = (app) => {
    const paths = process.env.PATH.split(':');

    if (fs.existsSync(app)) return true;

    return paths.some((path) => fs.existsSync(`${path}/${app}`));
};

export const blockRoot = () => {
    if (process.env.NODE_ENV === 'test') return;
    execSync('usermod -s /usr/sbin/nologin root');
    fs.writeFileSync('/etc/sudoers.d/ulysse', `${process.env.SUDO_USER} ALL=(ALL) !ALL`, 'utf8');

    const { whitelist } = readConfig();

    for (const w of whitelist) {
        if (isValidApp(w.name)) {
            fs.appendFileSync('/etc/sudoers.d/ulysse', `\n${process.env.SUDO_USER} ALL=(ALL) ${w.name}`, 'utf8');
        }
    }

    fs.chmodSync('/etc/sudoers.d/ulysse', '0440');
};

export const unblockRoot = () => {
    execSync('usermod -s /bin/bash root');
    if (fs.existsSync('/etc/sudoers.d/ulysse')) {
        fs.unlinkSync('/etc/sudoers.d/ulysse');
    }
};

export const removeDuplicates = (arr) => {
    const set = new Set(arr.map((e) => JSON.stringify(e)));
    return Array.from(set).map((e) => JSON.parse(e));
};

/* eslint-disable-next-line complexity */
export const editConfig = (config, path = CONFIG_PATH) => {
    const currentConfig = readConfig(path);
    const { blocklist = [], whitelist = [], passwordHash, password, date } = config;

    const newBlocklist = removeDuplicates([...currentConfig.blocklist, ...blocklist]);
    const newWhitelist = removeDuplicates([...currentConfig.whitelist, ...whitelist]);

    const newConfig = {
        ...currentConfig,
        date: date || new Date().toISOString(),
        blocklist: currentConfig.shield ? newBlocklist : blocklist,
        whitelist: currentConfig.shield ? currentConfig.whitelist : newWhitelist,
    };

    if (isValidPassword(password, path)) {
        unblockRoot();
        newConfig.shield = false;
        delete newConfig.passwordHash;
    }

    if (config.shield && passwordHash) {
        blockRoot();
        newConfig.shield = true;
        newConfig.passwordHash = passwordHash;
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
        const bin = cmd.split(' ').shift();

        return { pid: folder, cmd, name, bin };
    });

    apps = apps.filter((p) => p.name);

    return apps;
}, []);

export const isValidDomain = (domain) => /^([\w-]+\.)+[\w-]+$/.test(domain);

export const getTimeType = (time) => {
    const durationPattern = /^(\d+d)?(\d+h)?(\d+m)?$/;
    const intervalPattern = /^\d+h-\d+h$/;

    if (durationPattern.test(time)) return 'duration';
    if (intervalPattern.test(time)) return 'interval';

    return 'unknown';
};

const isValidTime = (time) => getTimeType(time) !== 'unknown';

export const isValidDistraction = (distraction) => {
    const { name, time } = distraction;

    if (time && !isValidTime(time)) return false;

    return isValidDomain(name) || isValidApp(name);
};

export const blockDistraction = (distraction) => {
    const config = readConfig();
    config.blocklist.push(distraction);
    config.blocklist = removeDuplicates(config.blocklist);
    sendDataToSocket(config);
};

export const unblockDistraction = (distraction) => {
    const config = readConfig();
    config.blocklist = config.blocklist.filter((d) => JSON.stringify(d) !== JSON.stringify(distraction));
    sendDataToSocket(config);
};

export const whitelistDistraction = (distraction) => {
    const config = readConfig();
    config.whitelist.push(distraction);
    sendDataToSocket(config);
};

export const rootDomain = (domain) => domain.split('.').slice(-2).join('.');

export const isDistractionBlocked = (distraction) => {
    const { blocklist, whitelist } = readConfig();
    const time = blocklist.find((d) => d.name === rootDomain(distraction))?.time;

    const isWhitelisted = whitelist.some((d) => d.name === rootDomain(distraction));
    const isBlocked = blocklist.some((d) => {
        if (getTimeType(time) === 'interval') {
            const date = new Date();
            const hour = date.getHours();

            const [start, end] = time.split('-').map((t) => parseInt(t, 10));
            const isBlockedHour = hour >= start && hour < end;

            return isBlockedHour;
        }

        return d.name === rootDomain(distraction);
    });

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
    const config = readConfig();

    const blocklist = config.blocklist
        .filter((d) => isValidApp(d.name))
        .filter((d) => isDistractionBlocked(d.name))
        .map(({ name }) => name);

    const blockedApps = getRunningApps()
        .filter((a) => blocklist?.includes(a.cmd) || blocklist?.includes(a.bin) || blocklist?.includes(a.name))
        .map((p) => ({ ...p, name: blocklist.find((b) => b === p.cmd || b === p.name) }));

    if (!blockedApps.length) return [];

    for (const app of blockedApps) {
        exec(`kill -9 ${app.pid}`);
    }

    return removeDuplicates(blockedApps.map((p) => p.name));
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

/* eslint-disable-next-line complexity */
export const decrementTime = (time) => {
    let [hours, minutes] = time.includes('h') ? time.split('h') : [0, time];
    minutes = minutes.includes('m') ? parseInt(minutes, 10) : (hours = parseInt(hours, 10), 0);
    if (time.includes('d')) return '23h59m';

    minutes -= 1;

    if (minutes < 0) {
        hours = hours ? hours - 1 : 23;
        minutes = 59;
    }

    if (hours === 0 && minutes === 0) {
        return '0m';
    }

    return `${hours ? `${hours}h` : ''}${minutes > 0 ? `${minutes}m` : '0m'}`;
};
