import fs from 'fs';
import net from 'net';
import socket from './socket.io';
import { config, editConfig } from './config';
import { SOCKET_PATH } from './constants';

if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);

const server = net.createServer((connection) => {
    let buffer = '';

    connection.on('data', (data) => {
        buffer += data.toString();
    });

    connection.on('end', () => {
        const newConfig = JSON.parse(buffer);
        socket.emit('synchronize', {
            ...editConfig(newConfig),
            password: config?.password,
            date: new Date().toISOString(),
        });
    });
});

server.listen(SOCKET_PATH, () => {
    const uid = Number(process.env.SUDO_UID || process.getuid());
    const gid = Number(process.env.SUDO_GID || process.getgid());
    fs.chownSync(SOCKET_PATH, uid, gid);
});
