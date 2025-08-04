import fs from 'fs';
import net from 'net';
import { config } from './config';
import { SOCKET_PATH, CONFIG_PATH } from './constants';
import { removeDuplicates } from './utils';
import { blockRoot, unblockRoot, isValidPassword } from './shield';

const removeTimeouts = (list) => list.filter(({ timeout }) => !timeout || timeout >= Math.floor(Date.now() / 1000));

// eslint-disable-next-line complexity
const editConfig = (newConfig) => {
    const { blocklist = [], whitelist = [], date, shield, password, passwordHash } = newConfig;

    config.date = date;
    config.whitelist = removeTimeouts(removeDuplicates(config.shield.enable ? config.whitelist : whitelist));
    config.blocklist = removeTimeouts(removeDuplicates(config.shield.enable ? [...config.blocklist, ...blocklist] : blocklist));

    if (isValidPassword(password) || config.shield.timeout <= Math.floor(Date.now() / 1000)) {
        unblockRoot();
        delete config.password;
        delete config.passwordHash;
        delete config.shield.timeout;
        config.shield.enable = false;
    }

    if (shield.enable) {
        blockRoot();
        if (shield.timeout) {
            config.shield.enable = true;
            config.shield.timeout = shield.timeout;
        }

        if (passwordHash) {
            config.shield.enable = true;
            config.passwordHash = passwordHash;
        }
    }

    delete config.password;

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8');
};

const server = net.createServer((connection) => {
    let buffer = '';

    connection.on('data', (data) => {
        buffer += data.toString();
    });

    connection.on('end', () => {
        const data = JSON.parse(buffer);
        const newConfig = { ...data, date: new Date().toISOString() };

        editConfig(newConfig);
    });
});

export const socket = () => {
    if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);

    server.listen(SOCKET_PATH, () => {
        const uid = Number(process.env.SUDO_UID || process.getuid());
        const gid = Number(process.env.SUDO_GID || process.getgid());
        fs.chownSync(SOCKET_PATH, uid, gid);
    });
};
