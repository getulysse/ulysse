import { config, readConfig, editConfig } from '../src/config';
import { DEFAULT_CONFIG } from '../src/constants';
import { whitelistDistraction } from '../src/whitelist';
import { enableShieldMode, disableShieldMode } from '../src/shield';
import { blockDistraction, unblockDistraction } from '../src/block';
import { sha256 } from '../src/utils';

beforeEach(async () => {
    await disableShieldMode('ulysse');
    await editConfig(DEFAULT_CONFIG);
    Object.assign(config, DEFAULT_CONFIG);
    jest.spyOn(console, 'log').mockImplementation(() => {});
});

test('Should enable shield mode', async () => {
    await enableShieldMode('ulysse');

    const { password, passwordHash, shield } = readConfig();
    expect(password).toBeUndefined();
    expect(passwordHash).toBe(sha256('ulysse'));
    expect(shield.enable).toBe(true);
});

test('Should disable shield mode', async () => {
    await enableShieldMode('ulysse');

    await disableShieldMode('ulysse');

    expect(readConfig().shield.enable).toBe(false);
    expect(readConfig().passwordHash).toBeUndefined();
});

test('Should not disable shield mode if bad password', async () => {
    await enableShieldMode('ulysse');
    await disableShieldMode('badpassword');

    expect(readConfig().shield.enable).toBe(true);
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
