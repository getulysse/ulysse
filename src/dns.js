import dgram from 'dgram';
import packet from 'native-dns-packet';
import { readConfig, isDomainBlocked } from './utils';
import { DNS_SERVER, DNS_PORT, DNS_TYPE } from './constants';

const server = dgram.createSocket('udp4');

server.on('message', async (msg, rinfo) => {
    const { blocklist, whitelist } = readConfig();

    const proxy = dgram.createSocket('udp4');

    proxy.on('message', (response) => {
        const responsePacket = packet.parse(response);
        const domain = responsePacket.question?.[0]?.name;

        const isBlocked = isDomainBlocked(domain, blocklist, whitelist);

        if (!isBlocked || responsePacket.answer.length === 0) {
            server.send(response, rinfo.port, rinfo.address);
            proxy.close();
            return;
        }

        responsePacket.answer = responsePacket.answer.map((answer) => {
            if (answer.type === DNS_TYPE.A || answer.type === DNS_TYPE.AAAA) {
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

server.bind(DNS_PORT);

console.log(`Starting DNS server on port ${DNS_PORT}...`);
