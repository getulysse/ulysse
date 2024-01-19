import {
    readConfig,
    editConfig,
    blockDistraction,
    unblockDistraction,
    isValidDistraction,
    whitelistDistraction,
} from '../src/utils';

beforeEach(() => {
    editConfig({ blocklist: [], whitelist: [], shield: false });
});

test('Should edit config file', async () => {
    const newConfig = {
        blocklist: ['youtube.com', 'twitter.com', 'signal-desktop', 'kodi'],
        whitelist: ['spotify.com'],
    };

    editConfig(newConfig);

    const config = readConfig();
    expect(config).toEqual(expect.objectContaining(newConfig));
});

test('Should block a domain', async () => {
    const domain = 'chess.com';

    await blockDistraction(domain);

    const config = readConfig();
    expect(config.blocklist).toContain(domain);
});

test('Should block an app', async () => {
    const app = 'chromium';

    await blockDistraction(app);

    const config = readConfig();
    expect(config.blocklist).toContain(app);
});

test('Should unblock a domain', async () => {
    const domain = 'chess.com';

    await unblockDistraction(domain);

    const config = readConfig();
    expect(config.blocklist).not.toContain(domain);
});

test('Should unblock an app', async () => {
    const app = 'chromium';

    await unblockDistraction(app);

    const config = readConfig();
    expect(config.blocklist).not.toContain(app);
});

test('Should whitelist a domain', async () => {
    const domain = 'chess.com';

    await whitelistDistraction(domain);

    const config = readConfig();
    expect(config.whitelist).toContain(domain);
});

test('Should check distraction value', async () => {
    expect(isValidDistraction('chess.com')).toBe(true);
    expect(isValidDistraction('chromium')).toBe(true);
    expect(isValidDistraction('inexistent')).toBe(false);
});
