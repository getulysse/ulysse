import dgram from 'dgram';
import packet from 'native-dns-packet';

const server = dgram.createSocket('udp4');

const records = {
    1: 'A',
    2: 'NS',
    5: 'CNAME',
    6: 'SOA',
    12: 'PTR',
    15: 'MX',
    16: 'TXT',
    28: 'AAAA',
};

server.on('message', (msg, rinfo) => {
    try {
        const query = packet.parse(msg);

        const { name, type, class: class_ } = query.question[0];

        if (records[type] !== 'A' && records[type] !== 'AAAA') {
            return;
        }

        const response = {
            header: {
                id: query.header.id,
            },
            question: query.question,
            answer: [{
                name,
                type,
                class: class_,
                ttl: 300,
                address: '127.0.0.1',
            }],
            authority: [],
            additional: [],
        };

        const buf = Buffer.alloc(4096);
        const responseBuffer = packet.write(buf, response);
        const res = buf.slice(0, responseBuffer);
        server.send(res, rinfo.port, rinfo.address);
    } catch (err) {
        console.error(err);
    }
});

server.bind(53);

console.log('DNS Server started on port 53');
