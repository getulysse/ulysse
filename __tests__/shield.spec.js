import { config } from '../src/config';
import { enableShieldMode, disableShieldMode } from '../src/shield';
import { whitelistDistraction } from '../src/whitelist';
import { blockDistraction, unblockDistraction } from '../src/block';

jest.mock('child_process', () => ({
    execSync: jest.fn().mockImplementation(() => false),
}));

beforeEach(() => {
    config.blocklist = [];
    config.whitelist = [];
    config.shield = false;
    config.password = 'ulysse';
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('Should enable shield mode', async () => {
    enableShieldMode('ulysse');

    const passwordHash = 'd97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b';
    expect(config.passwordHash).toBe(passwordHash);
    expect(config.shield).toBe(true);
});

test('Should disable shield mode', async () => {
    enableShieldMode('ulysse');

    disableShieldMode('ulysse');

    expect(config.shield).toBe(false);
});

test('Should not disable shield mode if bad password', async () => {
    enableShieldMode('ulysse');

    disableShieldMode('badpassword');

    expect(config.shield).toBe(true);
});

test('Should not unblock a distraction if shield mode is enabled', async () => {
    blockDistraction({ name: 'example.com' });
    enableShieldMode('ulysse');

    unblockDistraction({ name: 'example.com' });

    expect(config.blocklist).toEqual([{ name: 'example.com' }]);
});

test('Should not whitelist a distraction if shield mode is enabled', async () => {
    enableShieldMode('ulysse');

    whitelistDistraction({ name: 'example.com' });

    expect(config.whitelist).toEqual([]);
});
