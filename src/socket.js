import 'dotenv/config';
import fs from 'fs';
import net from 'net';
import socket from './socket.io';
import { config } from './config';
import { removeDuplicates } from './utils';
import { SOCKET_PATH, CONFIG_PATH } from './constants';
import { blockRoot, unblockRoot, isValidPassword } from './shield';

if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);

const editConfig = (newConfig) => {
    const { blocklist = [], whitelist = [], shield, password, passwordHash } = newConfig;

    config.date = new Date().toISOString();
    config.whitelist = removeDuplicates(config.shield ? config.whitelist : whitelist);
    config.blocklist = removeDuplicates(config.shield ? [...config.blocklist, ...blocklist] : blocklist);

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

    socket.emit('synchronize', {
        ...config,
        date: new Date().toISOString(),
    });

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4), 'utf8');
};

const server = net.createServer((connection) => {
    let buffer = '';

    connection.on('data', (data) => {
        buffer += data.toString();
    });

    connection.on('end', () => {
        const newConfig = JSON.parse(buffer);
        editConfig(newConfig);
    });
});

server.listen(SOCKET_PATH, () => {
    const uid = Number(process.env.SUDO_UID || process.getuid());
    const gid = Number(process.env.SUDO_GID || process.getgid());
    fs.chownSync(SOCKET_PATH, uid, gid);
});
