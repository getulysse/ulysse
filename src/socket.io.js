import { io } from 'socket.io-client';
import { readConfig, editConfig } from './config';
import { SERVER_HOST } from './constants';

const socket = io(SERVER_HOST);

socket.on('connect', () => {
    console.log('Connected to the server');
});

socket.on('synchronize', async (newConfig) => {
    const config = readConfig();

    if (new Date(newConfig.date) > new Date(config.date)) {
        await editConfig({ ...newConfig, date: newConfig.date });
        console.log('Synchronize...');
    }
});

setInterval(() => {
    const config = readConfig();
    socket.emit('synchronize', config);
}, 60000);

export default socket;
