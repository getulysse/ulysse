import 'dotenv/config';
import fs from 'fs';
import net from 'net';
import Gun from 'gun';
import { config } from './config';
import { removeDuplicates } from './utils';
import { SOCKET_PATH, CONFIG_PATH, GUN_SERVER } from './constants';
import { blockRoot, unblockRoot, isValidPassword } from './shield';

const removeTimeouts = (list) => list.filter(({ timeout }) => !timeout || timeout >= Math.floor(Date.now() / 1000));

const editConfig = (newConfig) => {
    const { blocklist = [], whitelist = [], date, shield, password, passwordHash } = newConfig;

    config.date = date;
    config.whitelist = removeTimeouts(removeDuplicates(config.shield ? config.whitelist : whitelist));
    config.blocklist = removeTimeouts(removeDuplicates(config.shield ? [...config.blocklist, ...blocklist] : blocklist));

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

        if (process.env.NODE_ENV !== 'test' && data.gun !== false) {
            const gun = Gun({ peers: [GUN_SERVER], axe: false });
            gun.get('db').get('config').put(JSON.stringify(newConfig));
        }
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
