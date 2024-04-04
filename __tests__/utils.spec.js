import {
    editConfig,
    getTimeType,
    createTimeout,
    getRunningApps,
    isWithinTimeRange,
    isValidDistraction,
    isDistractionBlocked,
    getRunningBlockedApps,
} from '../src/utils';

jest.mock('child_process', () => ({
    execSync: jest.fn().mockImplementation(() => false),
}));

beforeEach(() => {
    editConfig({ shield: false, password: 'ulysse', blocklist: [], whitelist: [] });
});

test('Should add a distraction to blocklist', async () => {
    const distraction = { name: 'example.com' };

    const config = editConfig({ blocklist: [distraction] });

    expect(config.blocklist).toEqual(expect.arrayContaining([distraction]));
});

test('Should remove a distraction from blocklist', async () => {
    editConfig({ blocklist: [{ name: 'example.com' }] });

    const { blocklist } = editConfig({ blocklist: [] });

    expect(blocklist).toEqual([]);
});

test('Should not remove a distraction from blocklist if shield mode is enabled', async () => {
    const distraction = { name: 'example.com' };
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    editConfig({ shield: true, passwordHash, blocklist: [distraction] });

    const config = editConfig({ blocklist: [] });

    expect(config.blocklist).toEqual(expect.arrayContaining([distraction]));
});

test('Should whitelist a distraction', async () => {
    const distraction = { name: 'example.com' };

    const config = editConfig({ whitelist: [distraction] });

    expect(config.whitelist).toEqual(expect.arrayContaining([distraction]));
});

test('Should not whitelist a distraction if shield mode is enabled', async () => {
    const distraction = { name: 'example.com' };
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    editConfig({ shield: true, passwordHash, blocklist: [], whitelist: [] });

    const config = editConfig({ whitelist: [distraction] });

    expect(config.whitelist).toEqual([]);
});

test('Should enable shield mode', async () => {
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';

    const config = editConfig({ shield: true, passwordHash });

    expect(config.passwordHash).toBe(passwordHash);
});

test('Should disable shield mode', async () => {
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    editConfig({ passwordHash, shield: true });

    const config = editConfig({ shield: false, password: 'ulysse' });

    expect(config.shield).toBe(false);
});

test('Should not disable shield mode if password is wrong', async () => {
    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    editConfig({ passwordHash, shield: true });

    const config = editConfig({ shield: false, password: 'badpassword' });

    expect(config.shield).toBe(true);
});

test('Should get all running apps', async () => {
    const apps = getRunningApps();

    expect(JSON.stringify(apps)).toContain('node');
});

test('Should create a timeout incremented by a duration', async () => {
    const timestamp = 1704063600;
    expect(createTimeout('30m', timestamp)).toBe(1704065400);
    expect(createTimeout('2h', timestamp)).toBe(1704070800);
    expect(createTimeout('1h59m', timestamp)).toBe(1704070740);
    expect(createTimeout('1d', timestamp)).toBe(1704150000);
    expect(createTimeout('1m', timestamp)).toBe(1704063660);
});

test('Should get duration time type', () => {
    expect(getTimeType('1d')).toBe('duration');
    expect(getTimeType('30m')).toBe('duration');
    expect(getTimeType('1h30m')).toBe('duration');
    expect(getTimeType('10h-18h')).toBe('interval');
});

test('Should block an app', async () => {
    editConfig({ blocklist: [{ name: 'chromium' }] });

    const isBlocked = isDistractionBlocked('chromium');

    expect(isBlocked).toBe(true);
});

test('Should block a distraction with a duration', async () => {
    const distraction = { name: 'twitter.com', time: '2m' };
    editConfig({ blocklist: [distraction] });

    const isBlocked = isDistractionBlocked('twitter.com');

    expect(isBlocked).toBe(true);
});

test('Should block an app with a time-based interval', async () => {
    const currentDate = new Date('2021-01-01T12:00:00Z');
    editConfig({ blocklist: [{ name: 'chromium', time: '0h-23h' }] });
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    const isBlocked = isDistractionBlocked('chromium');

    expect(isBlocked).toBe(true);
});

test('Should not block an app with a time-based interval', async () => {
    const currentDate = new Date('2021-01-01T22:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);
    editConfig({ blocklist: [{ name: 'chromium', time: '0h-20h' }] });

    const isBlocked = isDistractionBlocked('chromium');

    expect(isBlocked).toBe(false);
});

test('Should block a specific subdomain', async () => {
    editConfig({ blocklist: [{ name: 'www.example.com' }] });

    expect(isDistractionBlocked('www.example.com')).toBe(true);
    expect(isDistractionBlocked('example.com')).toBe(false);
});

test('Should block a distraction with a time-based interval', async () => {
    const currentDate = new Date('2021-01-01T12:00:00Z');
    editConfig({ blocklist: [{ name: 'example.com', time: '0h-23h' }] });
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    const isBlocked = isDistractionBlocked('example.com');

    expect(isBlocked).toBe(true);
});

test('Should block all subdomains of a domain with a wildcard', async () => {
    editConfig({ blocklist: [{ name: '*.example.com' }] });

    const isBlocked = isDistractionBlocked('www.example.com');

    expect(isBlocked).toBe(true);
});

test('Should block all subdomains of a domain with a wildcard & a subdomain', async () => {
    editConfig({ blocklist: [{ name: '*.www.example.com' }] });

    const isBlocked = isDistractionBlocked('www.example.com');

    expect(isBlocked).toBe(true);
});

test('Should block all subdomains of a domain with a wildcard & a time-based interval', async () => {
    const currentDate = new Date('2021-01-01T12:00:00Z');
    editConfig({ blocklist: [{ name: '*.example.com', time: '0h-19h' }] });
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    const isBlocked = isDistractionBlocked('www.example.com');

    expect(isBlocked).toBe(true);
});

test('Should not block a subdomain of a domain with a wildcard & a time-based interval', async () => {
    const currentDate = new Date('2021-01-01T20:00:00Z');
    editConfig({ blocklist: [{ name: '*.example.com', time: '0h-19h' }] });
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    const isBlocked = isDistractionBlocked('www.example.com');

    expect(isBlocked).toBe(false);
});

test('Should block all domains with *.*', async () => {
    editConfig({ blocklist: [{ name: '*.*' }] });

    const isBlocked = isDistractionBlocked('example.com');

    expect(isBlocked).toBe(true);
});

test('Should block all domains with *.* except for the whitelist', async () => {
    editConfig({ blocklist: [{ name: '*.*' }], whitelist: [{ name: 'www.example.com' }] });

    const isBlocked = isDistractionBlocked('www.example.com');

    expect(isBlocked).toBe(false);
});

test('Should not block apps if *.* is in the blocklist', async () => {
    editConfig({ blocklist: [{ name: '*.*' }] });

    const isBlocked = isDistractionBlocked('chromium');

    expect(isBlocked).toBe(false);
});

test('Should not block a domain if it is in the whitelist with a wildcard', async () => {
    editConfig({ blocklist: [{ name: '*.*' }], whitelist: [{ name: '*.example.com' }] });

    const isBlocked = isDistractionBlocked('www.example.com');

    expect(isBlocked).toBe(false);
});

test('Should remove a distraction from blocklist if timeout is reached and shield mode is enabled', async () => {
    editConfig({
        shield: true,
        blocklist: [{ name: 'chromium' }, { name: '*.*', timeout: 1708617136 }],
        passwordHash: 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b',
    });

    const { blocklist } = editConfig({ blocklist: [{ name: 'chromium' }] });

    expect(blocklist).toEqual([{ name: 'chromium' }]);
});

test('Should check if a time is within an interval', async () => {
    const currentDate = new Date('2021-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);

    expect(isWithinTimeRange('0h-23h')).toBe(true);
    expect(isWithinTimeRange('0h-19h')).toBe(true);
    expect(isWithinTimeRange('20h-23h')).toBe(false);
});

test('Should check distraction value', async () => {
    expect(isValidDistraction({ name: '' })).toBe(false);
    expect(isValidDistraction({ name: '*' })).toBe(false);
    expect(isValidDistraction({ name: '*.*' })).toBe(true);
    expect(isValidDistraction({ name: '*.example.com' })).toBe(true);
    expect(isValidDistraction({ name: 'example.com' })).toBe(true);
    expect(isValidDistraction({ name: 'chromium' })).toBe(true);
    expect(isValidDistraction({ name: 'chromium', time: 'badtime' })).toBe(false);
    expect(isValidDistraction({ name: 'chromium', time: '1m' })).toBe(true);
    expect(isValidDistraction({ name: 'inexistent' })).toBe(false);
});

test('Should run isDistractionBlocked in less than 150ms with a large blocklist', async () => {
    editConfig({ blocklist: Array.from({ length: 500000 }, (_, i) => ({ name: `${i + 1}.com` })) });

    isDistractionBlocked('example.com');

    const start = process.hrtime();
    isDistractionBlocked('example.com');
    const end = process.hrtime(start);

    expect(end[1] / 1000000).toBeLessThan(150);
});

test('Should run getRunningBlockedApps in less than 100ms with a large blocklist', async () => {
    editConfig({ blocklist: Array.from({ length: 500000 }, (_, i) => ({ name: `${i + 1}.com` })) });

    const start = process.hrtime();
    getRunningBlockedApps();
    const end = process.hrtime(start);

    expect(end[1] / 1000000).toBeLessThan(100);
});
