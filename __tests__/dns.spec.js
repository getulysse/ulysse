import { isDomainBlocked } from '../src/utils';

test('Should check if a domain from the blocklist is blocked', async () => {
    const blocklist = ['youtube.com'];
    const domain = 'youtube.com';

    const isBlocked = isDomainBlocked(domain, blocklist);

    expect(isBlocked).toBe(true);
});

test('Should check if a domain from the whitelist is not blocked', async () => {
    const blocklist = ['youtube.com'];
    const whitelist = ['youtube.com'];
    const domain = 'youtube.com';

    const isBlocked = isDomainBlocked(domain, blocklist, whitelist);

    expect(isBlocked).toBe(false);
});
