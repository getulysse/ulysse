import { config, readConfig, editConfig } from '../src/config';
import { DEFAULT_CONFIG } from '../src/constants';
import { disableShieldMode } from '../src/shield';
import { blockDistraction, isDistractionBlocked } from '../src/block';
import { isDistractionWhitelisted, whitelistDistraction } from '../src/whitelist';

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

test('Should not block a process from the system whitelist', async () => {
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
