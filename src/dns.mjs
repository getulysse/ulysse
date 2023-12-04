import dgram from 'dgram';
import packet from 'native-dns-packet';
import { config } from './utils.mjs';

const DNS_SERVER = '9.9.9.9';

const server = dgram.createSocket('udp4');

server.on('message', async (msg, rinfo) => {
    const { currentProfile, profiles, server: serverUrl } = config();
    const { hosts, whitelist } = profiles.find((p) => p.name === currentProfile);

    const proxy = dgram.createSocket('udp4');

    proxy.on('message', (response) => {
        const responsePacket = packet.parse(response);
        const domain = responsePacket.question?.[0]?.name;

        if (domain === serverUrl.replace('https://', '')) {
            server.send(response, rinfo.port, rinfo.address);
            proxy.close();
            return;
        }

        if (whitelist.includes(domain)) {
            server.send(response, rinfo.port, rinfo.address);
            proxy.close();
            return;
        }

        if (!hosts.includes(domain) && !hosts.includes('*')) {
            server.send(response, rinfo.port, rinfo.address);
            proxy.close();
            return;
        }

        if (responsePacket.answer.length === 0) {
            server.send(response, rinfo.port, rinfo.address);
            proxy.close();
            return;
        }

        responsePacket.answer = responsePacket.answer.map((answer) => {
            if (answer.type === 1) {
                return { ...answer, address: '127.0.0.1' };
            }

            return answer;
        });

        const buffer = Buffer.alloc(4096);
        packet.write(buffer, responsePacket);
        server.send(buffer, 0, buffer.length, rinfo.port, rinfo.address);
        proxy.close();
    });

    proxy.send(msg, 0, msg.length, 53, DNS_SERVER);
});

server.bind(53);

console.log('DNS Server started on port 53');
