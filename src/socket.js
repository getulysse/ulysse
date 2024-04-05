import fs from 'fs';
import net from 'net';
import { editConfig } from './utils';
import { SOCKET_PATH } from './constants';
import socket from './socket.io';

if (fs.existsSync(SOCKET_PATH)) fs.unlinkSync(SOCKET_PATH);

const server = net.createServer((connection) => {
    let buffer = '';

    connection.on('data', (data) => {
        buffer += data.toString();
    });

    connection.on('end', () => {
        const config = JSON.parse(buffer);
        socket.emit('synchronize', {
            ...editConfig({ ...config, date: new Date().toISOString() }),
            password: config?.password,
        });
    });
});

server.listen(SOCKET_PATH, () => {
    const uid = Number(process.env.SUDO_UID || process.getuid());
    const gid = Number(process.env.SUDO_GID || process.getgid());
    fs.chownSync(SOCKET_PATH, uid, gid);
});
