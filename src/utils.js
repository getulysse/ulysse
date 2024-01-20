import fs from 'fs';
import dns from 'dns';
import uti from 'util';
import crypto from 'crypto';
import readline from 'readline';
import { dirname } from 'path';
import { exec } from 'child_process';
import { DEFAULT_CONFIG_PATH, DEFAULT_CONFIG, DNS_SERVER } from './constants';

const tryCatch = (fn) => (...args) => {
    try {
        return fn(...args);
    } catch (error) {
        return false;
    }
};

export const createConfig = (path, config = DEFAULT_CONFIG) => {
    const uid = Number(process.env.SUDO_UID || process.getuid());
    const gid = Number(process.env.SUDO_GID || process.getgid());

    fs.mkdirSync(dirname(path), { recursive: true });
    fs.writeFileSync(path, JSON.stringify(config, null, 4), 'utf8');
    fs.chownSync(path, uid, gid);
};

export const readConfig = (path = DEFAULT_CONFIG_PATH) => {
    if (!fs.existsSync(path)) createConfig(path);
    const config = JSON.parse(fs.readFileSync(path, 'utf8'));

    return config;
};

export const isFileWritable = tryCatch((path) => {
    fs.accessSync(path, fs.constants.W_OK);
    return true;
});

export const editConfig = (config, path = DEFAULT_CONFIG_PATH) => {
    if (isFileWritable(path)) {
        fs.writeFileSync(path, JSON.stringify(config, null, 4), 'utf8');
    } else {
        createConfig(`${path}.tmp`, config);
    }
};

export const getDomainIp = (domain) => new Promise((resolve) => {
    dns.lookup(domain, { family: 4 }, (error, ip) => {
        if (error) resolve(false);
        resolve(ip);
    });
});

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
    editConfig(config);
};

export const unblockDistraction = (distraction) => {
    const config = readConfig();
    config.blocklist = config.blocklist.filter((d) => d !== distraction);
    editConfig(config);
};

export const whitelistDistraction = (distraction) => {
    const config = readConfig();
    config.whitelist.push(distraction);
    config.whitelist = [...new Set(config.whitelist)];
    editConfig(config);
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

    const apps = getApps() || [];

    const blockedApps = apps.filter((p) => blocklist?.includes(p.cmd) || blocklist?.includes(p.name));

    if (!blockedApps.length) return [];

    for (const app of blockedApps) {
        exec(`kill -9 ${app.pid}`);
    }

    return [...new Set(blockedApps.map((p) => p.name))];
};

export const isDaemonRunning = () => {
    const apps = getApps();

    const cmds = ['ulysse -d', 'ulysse --daemon'];

    return cmds.some((cmd) => apps.some((app) => app.cmd.includes(cmd)));
};

export const execSync = async (command) => {
    const execAsync = uti.promisify(exec);
    const { stdout } = await execAsync(command).catch(() => false);

    return stdout;
};

export const updateResolvConf = async (dnsServer = DNS_SERVER) => {
    await execSync('chattr -i /etc/resolv.conf');
    fs.writeFileSync('/etc/resolv.conf', `nameserver ${dnsServer}`, 'utf8');
    await execSync('chattr +i /etc/resolv.conf');
};

export const generatePassword = (length = 20) => {
    let password;
    const wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@%_+';

    const isValidPassword = (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[@%_+]/.test(pwd);

    do {
        password = Array.from(crypto.randomBytes(length)).map((byte) => wishlist[byte % wishlist.length]).join('');
    } while (!isValidPassword(password));

    return password;
};

export const sha256 = (str) => crypto.createHash('sha256').update(str).digest('hex');

export const enableShieldMode = () => {
    const config = readConfig();
    const password = generatePassword();
    const passwordHash = sha256(password);
    console.log(`Your password is: ${password}`);
    editConfig({ ...config, passwordHash, shield: true });
};

export const isValidPassword = (password) => {
    if (!password) return false;
    const config = readConfig();
    return sha256(String(password)) === config.passwordHash;
};

export const disableShieldMode = (password) => {
    editConfig({ password });
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

export const blockRoot = () => {
    exec(`chattr +i ${DEFAULT_CONFIG_PATH}`);
    fs.writeFileSync('/etc/sudoers.d/ulysse', `${process.env.SUDO_USER} ALL=(ALL) !ALL`, 'utf8');
    fs.chmodSync('/etc/sudoers.d/ulysse', '0440');
};

export const unblockRoot = () => {
    const { passwordHash, ...config } = readConfig();

    exec(`chattr -i ${DEFAULT_CONFIG_PATH}`).on('close', () => {
        editConfig({ ...config, shield: false });
    });

    if (fs.existsSync('/etc/sudoers.d/ulysse')) {
        fs.unlinkSync('/etc/sudoers.d/ulysse');
    }
};
