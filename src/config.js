import fs from 'fs';
import net from 'net';
import { dirname } from 'path';
import { isSudo, tryCatch } from './utils';
import { CONFIG_PATH, DEFAULT_CONFIG, SOCKET_PATH } from './constants';

export const sendDataToSocket = (data) => {
    const client = net.createConnection(SOCKET_PATH);

    if (typeof data === 'object') {
        client.write(JSON.stringify(data));
    } else {
        client.write(data);
    }

    client.end();
};

export const config = (tryCatch(() => {
    if (!fs.existsSync(CONFIG_PATH)) {
        fs.mkdirSync(dirname(CONFIG_PATH), { recursive: true });
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 4), 'utf8');
    }

    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
}, DEFAULT_CONFIG))();

export const editConfig = (newConfig) => {
    if (isSudo()) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 4), 'utf8');
    } else {
        sendDataToSocket(newConfig);
    }

    return newConfig;
};
