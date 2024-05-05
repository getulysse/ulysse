import dgram from 'dgram';
import packet from 'dns-packet';
import { isDistractionBlocked } from './block';
import { DNS_SERVER, DNS_PORT } from './constants';

export const dns = () => {
    const server = dgram.createSocket('udp4');

    server.on('message', async (msg, rinfo) => {
        const proxy = dgram.createSocket('udp4');

        proxy.on('message', (response) => {
            const responsePacket = packet.decode(response);
            const domain = responsePacket.questions?.[0]?.name;

            if (!isDistractionBlocked(domain) || responsePacket.answers.length === 0) {
                server.send(response, rinfo.port, rinfo.address);
                proxy.close();
                return;
            }

            responsePacket.answers = responsePacket.answers.map((answer) => {
                if (answer.type === 'A' || answer.type === 'AAAA') {
                    return { ...answer, data: answer.type === 'A' ? '127.0.0.1' : '::1' };
                }

                return answer;
            });

            const newPacket = packet.encode(responsePacket);
            server.send(newPacket, rinfo.port, rinfo.address);
            proxy.close();
        });

        proxy.send(msg, 0, msg.length, 53, DNS_SERVER);
    });

    server.bind(DNS_PORT);

    console.log(`Starting DNS server on port ${DNS_PORT}...`);
};
