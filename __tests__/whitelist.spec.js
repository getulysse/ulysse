import { config } from '../src/config';
import { blockDistraction, isDistractionBlocked } from '../src/block';
import { whitelistDistraction } from '../src/whitelist';

jest.mock('child_process', () => ({
    execSync: jest.fn().mockImplementation(() => false),
}));

beforeEach(() => {
    config.blocklist = [];
    config.whitelist = [];
    config.shield = false;
});

test('Should whitelist a distraction', async () => {
    const distraction = { name: 'example.com' };

    whitelistDistraction(distraction);

    expect(config.whitelist).toEqual([distraction]);
});

test('Should not block a domain if it is in the whitelist', async () => {
    blockDistraction({ name: '*.*' });
    whitelistDistraction({ name: 'www.example.com' });

    expect(isDistractionBlocked('www.example.com')).toBe(false);
});

test('Should not block a domain if it is in the whitelist with a wildcard', async () => {
    blockDistraction({ name: '*.*' });
    whitelistDistraction({ name: '*.example.com' });

    expect(isDistractionBlocked('www.example.com')).toBe(false);
});
