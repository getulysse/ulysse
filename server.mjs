import http from 'http';
import express from 'express';
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';
import { Server } from 'socket.io';

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const port = 3000;

process.env.JWT_SECRET = 'mys3cr3t';
process.env.JWT_TOKEN_TTL = '30d';

const isAuthenticated = async (token, secret) => {
    try {
        if (token) {
            return await jwtVerify(token, new TextEncoder().encode(secret));
        }

        return false;
    } catch (err) {
        return false;
    }
};

app.get('/', async (req, res) => {
    const token = req.params.token || req.headers['x-access-token'] || req.query.token;
    const isAuthenticatedUser = await isAuthenticated(token, process.env.JWT_SECRET);

    if (!isAuthenticatedUser) {
        res.status(401).send('Unauthorized');
        return;
    }

    io.emit('unblock');

    res.send('Unblocked');
});

app.post('/login', async (req, res) => {
    const token = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_TOKEN_TTL });
    res.json({ token });
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

server.listen(port, () => {
    console.log(`Listening on port ${port}`);
}).on('error', ({ message }) => {
    console.error(message);
    process.exit(1);
});
