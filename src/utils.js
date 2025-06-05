import fs from 'fs';
import crypto from 'crypto';
import readline from 'readline';
import { exec } from 'child_process';

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

export const removeDuplicates = (arr) => {
    const set = new Set(arr.map((e) => JSON.stringify(e)));
    return Array.from(set).map((e) => JSON.parse(e));
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

export const generatePassword = (length = 20) => {
    let password;

    const wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz@%_+';
    const checkPassword = (pwd) => /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[@%_+]/.test(pwd);

    do {
        password = Array.from(crypto.randomBytes(length)).map((byte) => wishlist[byte % wishlist.length]).join('');
    } while (!checkPassword(password));

    return password;
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

export const createTimeout = (duration, timestamp = Math.floor(Date.now() / 1000)) => {
    const units = { m: 60, h: 3600, d: 86400 };
    const match = duration.match(/(\d+)([mhd])/g);

    return match.reduce((acc, part) => {
        const value = parseInt(part, 10);
        const unit = part.match(/[mhd]/)[0];
        return acc + value * units[unit];
    }, timestamp);
};

export const getTimeType = (time) => {
    const durationPattern = /^(\d+d)?(\d+h)?(\d+m)?$/;
    const intervalPattern = /^\d+h-\d+h$/;

    if (durationPattern.test(time)) return 'duration';
    if (intervalPattern.test(time)) return 'interval';

    return 'unknown';
};

export const isWithinTimeRange = (time) => {
    if (!time || getTimeType(time) !== 'interval') return true;

    const [start, end] = time.split('-').map((t) => parseInt(t, 10));
    const hour = new Date().getHours();

    return hour >= start && hour < end;
};

export const getRunningApps = tryCatch(() => {
    const folders = fs.readdirSync('/proc').filter((f) => !Number.isNaN(Number(f)));

    return folders.map((folder) => {
        if (!fs.existsSync(`/proc/${folder}/status`) || !fs.existsSync(`/proc/${folder}/cmdline`)) return false;

        const status = fs.readFileSync(`/proc/${folder}/status`, 'utf8');
        const name = status.split('\n')[0].split(':').pop().trim();
        const cmd = fs.readFileSync(`/proc/${folder}/cmdline`, 'utf8').split('\u0000').join(' ').trim();
        const bin = cmd.split(' ').shift();

        return { pid: Number(folder), cmd, name, bin };
    }).filter((p) => p.name && p.cmd && p.bin);
}, []);

export const isDaemonRunning = () => {
    const apps = getRunningApps();

    const cmd = 'ulysse daemon start';

    return apps.some((app) => app.cmd.includes(cmd));
};

export const getAlias = (key) => key?.replace('--', '-').slice(0, 2);

export const getRootDomain = (domain) => domain.split('.').slice(-2).join('.');
