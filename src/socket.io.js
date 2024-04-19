import { io } from 'socket.io-client';
import { config, editConfig } from './config';
import { SERVER_HOST } from './constants';

const socket = io(SERVER_HOST);

socket.on('connect', () => {
    console.log('Connected to the server');
});

socket.on('synchronize', (newConfig) => {
    if (new Date(newConfig.date) > new Date(config.date)) {
        config.date = newConfig.date;
        config.blocklist = newConfig.blocklist;
        config.whitelist = newConfig.whitelist;
        editConfig(config);
        console.log('Synchronize...');
    }
});

setInterval(() => {
    socket.emit('synchronize', config);
}, 60000);

export default socket;
