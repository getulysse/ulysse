import fs from 'fs';
import net from 'net';
import crypto from 'crypto';
import readline from 'readline';
import { dirname } from 'path';
import { exec, execSync } from 'child_process';
import {
    DNS_SERVER,
    SOCKET_PATH,
    CONFIG_PATH,
    DOMAIN_REGEX,
    DEFAULT_CONFIG,
    RESOLV_CONF_PATH,
} from './constants';

export const config = (() => {
    if (!fs.existsSync(CONFIG_PATH)) {
        fs.mkdirSync(dirname(CONFIG_PATH), { recursive: true }).catch(() => false);
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4), 'utf8').catch(() => false);
    }

    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
})();

export const tryCatch = (fn, fallback = false, retry = 0) => (...args) => {
    try {
        return fn(...args);
    } catch (error) {
        if (retry <= 3) {
            return tryCatch(fn, fallback, retry + 1)(...args);
        }

        return fallback;
    }
};

export const sha256 = (str) => crypto.createHash('sha256').update(str).digest('hex');

export const isValidPassword = (password) => {
    if (!password) return false;
    const sha256sum = sha256(String(password));
    return sha256sum === config.passwordHash;
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

    if (!app) return false;

    if (fs.existsSync(app)) return true;

    return paths.some((path) => fs.existsSync(`${path}/${app}`));
};

export const blockRoot = () => {
    if (process.env.NODE_ENV === 'test') return;
    execSync('usermod -s /usr/sbin/nologin root');
    fs.writeFileSync('/etc/sudoers.d/ulysse', `${process.env.SUDO_USER} ALL=(ALL) !ALL`, 'utf8');

    for (const w of config.whitelist) {
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
export const editConfig = ({ blocklist = [], whitelist = [], shield, password, passwordHash, date }) => {
    config.date = date || new Date().toISOString();

    config.whitelist = removeDuplicates(config.shield ? config.whitelist : whitelist);
    config.blocklist = removeDuplicates(config.shield ? [...config.blocklist, ...blocklist] : blocklist);
    config.blocklist = config.blocklist.filter(({ timeout }) => !timeout || timeout >= Math.floor(Date.now() / 1000));
    config.whitelist = config.whitelist.filter(({ timeout }) => !timeout || timeout >= Math.floor(Date.now() / 1000));

    if (isValidPassword(password)) {
        unblockRoot();
        config.shield = false;
        delete config.passwordHash;
    }

    if (shield && passwordHash) {
        blockRoot();
        config.shield = true;
        config.passwordHash = passwordHash;
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8');

    return config;
};

export const getRunningApps = tryCatch(() => {
    const folders = fs.readdirSync('/proc').filter((f) => !Number.isNaN(Number(f)));

    return folders.map((folder) => {
        if (!fs.existsSync(`/proc/${folder}/status`) || !fs.existsSync(`/proc/${folder}/cmdline`)) return false;

        const status = fs.readFileSync(`/proc/${folder}/status`, 'utf8');
        const name = status.split('\n')[0].split(':').pop().trim();
        const cmd = fs.readFileSync(`/proc/${folder}/cmdline`, 'utf8').split('\u0000').join(' ').trim();
        const bin = cmd.split(' ').shift();

        return { pid: folder, cmd, name, bin };
    }).filter((p) => p.name);
}, []);

export const isValidDomain = (domain) => DOMAIN_REGEX.test(domain);

export const getTimeType = (time) => {
    const durationPattern = /^(\d+d)?(\d+h)?(\d+m)?$/;
    const intervalPattern = /^\d+h-\d+h$/;

    if (durationPattern.test(time)) return 'duration';
    if (intervalPattern.test(time)) return 'interval';

    return 'unknown';
};

const isValidTime = (time) => getTimeType(time) !== 'unknown';

export const isValidDistraction = (distraction) => {
    const { name = '', time = '' } = distraction;

    if (time && !isValidTime(time)) return false;

    if (name === '*.*') return true;

    if (name.includes('*.')) {
        const [, domain] = name.split('*.');
        return isValidDomain(domain);
    }

    return isValidDomain(name) || isValidApp(name);
};

export const createTimeout = (duration, timestamp = Math.floor(Date.now() / 1000)) => {
    const units = { m: 60, h: 3600, d: 86400 };
    const match = duration.match(/(\d+)([mhd])/g);

    return match.reduce((acc, part) => {
        const value = parseInt(part, 10);
        const unit = part.match(/[mhd]/)[0];
        return acc + value * units[unit];
    }, timestamp);
};

export const blockDistraction = (distraction) => {
    config.blocklist.push(distraction);
    config.blocklist = removeDuplicates(config.blocklist);
    config.blocklist = config.blocklist.map((d) => {
        if (getTimeType(d.time) === 'duration') {
            return { ...d, timeout: createTimeout(d.time) };
        }

        return d;
    });

    sendDataToSocket(config);
};

export const unblockDistraction = (distraction) => {
    config.blocklist = config.blocklist.filter(({ name, time }) => JSON.stringify({ name, time }) !== JSON.stringify(distraction));
    sendDataToSocket(config);
};

export const whitelistDistraction = (distraction) => {
    config.whitelist.push(distraction);
    config.whitelist = config.whitelist.map((d) => {
        if (getTimeType(d.time) === 'duration') {
            return { ...d, timeout: createTimeout(d.time) };
        }

        return d;
    });
    sendDataToSocket(config);
};

export const getRootDomain = (domain) => domain.split('.').slice(-2).join('.');

export const isDistractionWhitelisted = (distraction) => {
    if (config.whitelist.some((d) => d.name === distraction)) return true;
    if (config.whitelist.some((d) => d.name === '*')) return true;
    if (config.whitelist.some((d) => d.name === `*.${getRootDomain(distraction)}`)) return true;

    return false;
};

export const isWithinTimeRange = (time) => {
    if (!time || getTimeType(time) !== 'interval') return true;

    const [start, end] = time.split('-').map((t) => parseInt(t, 10));
    const hour = new Date().getHours();

    return hour >= start && hour < end;
};

export const isDomainBlocked = (domain, rule, rootDomain) => {
    if (!isValidDomain(domain)) return false;
    return rule === '*.*' || rule === domain || rule === `*.${rootDomain}` || rule === `*.${domain}`;
};

export const isDistractionBlocked = (distraction) => {
    if (isDistractionWhitelisted(distraction)) return false;

    const rootDomain = getRootDomain(distraction);
    const { blocklist } = config;

    return blocklist.some(({ name, time }) => (name === distraction || isDomainBlocked(distraction, name, rootDomain)) && isWithinTimeRange(time));
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

export const getRunningBlockedApps = () => {
    const blockedApps = config.blocklist
        .filter(({ name }) => !isValidDomain(name) && !name.includes('*'))
        .filter(({ name }) => !isDistractionWhitelisted(name))
        .filter(({ time }) => isWithinTimeRange(time))
        .map(({ name }) => name);

    const runningBlockedApps = getRunningApps()
        .filter((a) => blockedApps?.includes(a.cmd) || blockedApps?.includes(a.bin) || blockedApps?.includes(a.name))
        .map((p) => ({ ...p, name: blockedApps.find((b) => b === p.cmd || b === p.name) }));

    return runningBlockedApps || [];
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

export const enableShieldMode = (password = generatePassword()) => {
    const passwordHash = sha256(password);
    console.log(`Your password is: ${password}`);
    sendDataToSocket({ ...config, passwordHash, password, shield: true });
};

export const disableShieldMode = (password) => {
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
