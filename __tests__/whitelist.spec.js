import { config, readConfig, editConfig } from '../src/config';
import { DEFAULT_CONFIG } from '../src/constants';
import { disableShieldMode } from '../src/shield';
import { blockDistraction, isDistractionBlocked, getRunningBlockedApps } from '../src/block';
import { isDistractionWhitelisted, whitelistDistraction } from '../src/whitelist';

jest.mock('../src/utils', () => ({
    ...jest.requireActual('../src/utils'),
    getRunningApps: jest.fn().mockImplementation(() => [
        { name: 'calibre-paralle', pid: 1234, cmd: '/bin/calibre-parallel', bin: 'calibre-parallel' },
        { name: 'chromium', pid: 1234, cmd: '/bin/chromium', bin: 'chromium' },
        { name: 'node', pid: 1234, cmd: '/bin/node' },
    ]),
}));

beforeEach(async () => {
    await disableShieldMode('ulysse');
    await editConfig(DEFAULT_CONFIG);
    Object.assign(config, DEFAULT_CONFIG);
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('Should whitelist a distraction', async () => {
    const distraction = { name: 'example.com' };

    await whitelistDistraction(distraction);

    expect(readConfig().whitelist).toEqual([distraction]);
});

test('Should not block a domain if it is in the whitelist', async () => {
    await blockDistraction({ name: 'www.example.com' });
    await whitelistDistraction({ name: 'www.example.com' });

    expect(isDistractionBlocked('www.example.com')).toBe(false);
});

test('Should not block a domain if it is in the whitelist with a wildcard', async () => {
    await blockDistraction({ name: '*.*' });
    await whitelistDistraction({ name: '*.example.com' });

    expect(isDistractionBlocked('www.example.com')).toBe(false);
});

test.skip('Should not block a process from the system whitelist', async () => {
    await blockDistraction({ name: '*' });

    expect(isDistractionWhitelisted('systemd')).toBe(true);
});

test('Should not whitelist a blocked process outside of a time range', async () => {
    const currentDate = new Date('2021-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => currentDate);
    await blockDistraction({ name: 'example.com' });

    await whitelistDistraction({ name: 'example.com', time: '0h-1h' });

    expect(isDistractionBlocked('example.com')).toBe(true);
});

test('Should not block a process with a cropped name', async () => {
    await whitelistDistraction({ name: 'calibre-parallel' });

    await blockDistraction({ name: '*' });
    const runningBlockedApps = JSON.stringify(getRunningBlockedApps());

    expect(runningBlockedApps).not.toContain('calibre-parallel');
});
