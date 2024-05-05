import fs from 'fs';
import net from 'net';
import { dirname } from 'path';
import { isSudo, tryCatch } from './utils';
import { CONFIG_PATH, DEFAULT_CONFIG, SOCKET_PATH } from './constants';

export const sendDataToSocket = (data) => new Promise((resolve, reject) => {
    const client = net.createConnection(SOCKET_PATH);

    if (typeof data === 'object') {
        client.write(JSON.stringify(data));
    } else {
        client.write(data);
    }

    client.end();

    client.on('end', resolve);

    client.on('error', reject);
});

export const createConfig = () => {
    if (!fs.existsSync(CONFIG_PATH)) {
        fs.mkdirSync(dirname(CONFIG_PATH), { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4), 'utf8');
    }
};

export const readConfig = () => {
    createConfig();
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
};

export const editConfig = async (newConfig) => {
    await sendDataToSocket(newConfig);
};

export const config = (tryCatch(() => {
    createConfig();
    return readConfig();
}, DEFAULT_CONFIG))();
