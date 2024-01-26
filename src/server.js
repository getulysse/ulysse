import { Server } from 'socket.io';
import { SERVER_PORT } from './constants';

console.log('Starting server...');

const io = new Server(SERVER_PORT);

io.on('connection', (socket) => {
    console.log('Client connected');

    socket.on('synchronize', async (config) => {
        console.log('Synchronize...');
        io.emit('synchronize', config);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});
