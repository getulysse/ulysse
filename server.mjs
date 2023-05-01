import express from 'express';
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose';
import { unBlockRoot, unBlockApps, unBlockHosts, config } from './utils.mjs'; // eslint-disable-line

const app = express();
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

    await unBlockRoot();
    await unBlockApps();
    await unBlockHosts();
    res.send('Unblocked');
});

app.post('/login', async (req, res) => {
    const token = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: process.env.JWT_TOKEN_TTL });
    res.json({ token });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
