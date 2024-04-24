import { readConfig } from '../src/config';
import { whitelistDistraction } from '../src/whitelist';
import { enableShieldMode, disableShieldMode } from '../src/shield';
import { blockDistraction, unblockDistraction } from '../src/block';

beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('Should enable shield mode', async () => {
    await enableShieldMode('ulysse');

    const { password, passwordHash, shield } = readConfig();
    expect(password).toBeUndefined();
    expect(passwordHash).toBe('d97e609b03de7506d4be3bee29f2431b40e375b33925c2f7de5466ce1928da1b');
    expect(shield).toBe(true);
});

test('Should disable shield mode', async () => {
    await enableShieldMode('ulysse');

    await disableShieldMode('ulysse');

    expect(readConfig().shield).toBe(false);
    expect(readConfig().passwordHash).toBeUndefined();
});

test('Should not disable shield mode if bad password', async () => {
    await enableShieldMode('ulysse');
    await disableShieldMode('badpassword');

    expect(readConfig().shield).toBe(true);
});

test('Should not unblock a distraction if shield mode is enabled', async () => {
    await blockDistraction({ name: 'example.com' });
    await enableShieldMode('ulysse');

    await unblockDistraction({ name: 'example.com' });

    expect(readConfig().blocklist).toContainEqual({ name: 'example.com' });
});

test('Should not whitelist a distraction if shield mode is enabled', async () => {
    await enableShieldMode('ulysse');

    await whitelistDistraction({ name: 'example.com' });

    expect(readConfig().whitelist).not.toContainEqual({ name: 'example.com' });
});
