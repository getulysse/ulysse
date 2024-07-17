import 'dotenv/config';
import fs from 'fs';
import net from 'net';
import Gun from 'gun';
import { editConfig } from './edit';
import { SOCKET_PATH, GUN_SERVER } from './constants';

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
